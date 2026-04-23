
import { json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getProducts, getCollections, getBlogs, getPages } from "../models/shopify.server";
import { generateLLMsTxt } from "../services/llms.server";
import fs from "fs";

function logToFile(msg) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync("/tmp/app_log.txt", `${timestamp}: ${msg}\n`);
  } catch (e) {}
}

export const action = async ({ request }) => {
  logToFile(">>> GENERATE ACTION CALLED <<<");
  
  try {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;
    logToFile(`GENERATE Authenticated for: ${shop}`);

    const settings = await prisma.llmSetting.findUnique({
      where: { shop },
    });

    if (!settings) {
       logToFile("GENERATE ERROR: Settings not found in DB");
       return json({ success: false, error: "Settings not found" }, { status: 404 });
    }

    logToFile("GENERATE: Fetching Shopify Data...");
    // Use smaller limits for debugging if needed, but the models handle it
    const [products, collections, blogs, pages] = await Promise.all([
      getProducts(admin).catch(e => { logToFile(`Products Error: ${e.message}`); return []; }),
      getCollections(admin).catch(e => { logToFile(`Collections Error: ${e.message}`); return []; }),
      getBlogs(admin).catch(e => { logToFile(`Blogs Error: ${e.message}`); return []; }),
      getPages(admin).catch(e => { logToFile(`Pages Error: ${e.message}`); return []; }),
    ]);

    logToFile(`GENERATE: Fetched ${products.length} products`);

    const content = generateLLMsTxt({
      store: {
        name: settings.storeName || shop.split(".")[0],
        domain: settings.shopifyDomain,
        description: settings.description || "AI-optimized product catalog",
      },
      data: { products, collections, blogs, pages },
      settings
    });

    logToFile("GENERATE: Upserting to Database...");
    await prisma.llmFile.upsert({
      where: { shop },
      update: { content, updatedAt: new Date() },
      create: { shop, content },
    });

    logToFile("GENERATE: COMPLETE SUCCESS!");
    return json({ success: true, message: "LLMs.txt generated successfully!" });
  } catch (error) {
    logToFile(`GENERATE CRITICAL CRASH: ${error.message}`);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

export const loader = () => redirect("/app");
