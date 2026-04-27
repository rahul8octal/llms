import fs from "fs";
import path from "path";
import prisma from "../db.server";
import { getProducts, getCollections, getBlogs, getPages } from "../models/shopify.server";
import { generateLLMsTxt } from "./llms.server";

export async function syncLLMsFile(admin, shop, force = false) {
  try {
    const settings = await prisma.llmSetting.findUnique({ where: { shop } });
    if (!settings) {
      console.warn(`[Sync] No settings found for ${shop}`);
      return { success: false, error: "Settings not found" };
    }

    // Debounce: Don't sync more than once every 30 seconds unless forced
    if (!force) {
      const lastFile = await prisma.llmFile.findUnique({ 
        where: { shop }, 
        select: { updatedAt: true } 
      });
      if (lastFile && (Date.now() - new Date(lastFile.updatedAt).getTime() < 30000)) {
         console.log(`[Sync] Debouncing update for ${shop}. Last sync was < 30s ago.`);
         return { success: true, skip: true };
      }
    }

    const [products, collections, blogs, pages] = await Promise.all([
      getProducts(admin),
      getCollections(admin),
      getBlogs(admin),
      getPages(admin),
    ]);

    const content = generateLLMsTxt({
      store: {
        name: settings.storeName || shop.split(".")[0],
        domain: settings.shopifyDomain,
        description: settings.description || "AI-optimized product catalog",
      },
      data: { products, collections, blogs, pages },
      settings
    });

    await prisma.llmFile.upsert({
      where: { shop },
      update: { content, updatedAt: new Date() },
      create: { shop, content },
    });

    // Also store physically in public folder as requested
    try {
      const publicPath = path.join(process.cwd(), "public", "llms-files");
      if (!fs.existsSync(publicPath)) {
        fs.mkdirSync(publicPath, { recursive: true });
      }
      const filePath = path.join(publicPath, `llms-${shop}.txt`);
      fs.writeFileSync(filePath, content);
      console.log(`[Sync] Physical file saved at: ${filePath}`);
    } catch (fsError) {
      console.error(`[Sync] Failed to save physical file:`, fsError);
      // We don't fail the whole sync if only the physical file save fails, 
      // as the DB record is the primary source of truth for the proxy.
    }

    console.log(`[Sync] Successfully updated llms.txt for ${shop}`);
    return { success: true };
  } catch (error) {
    console.error(`[Sync] Failed for ${shop}:`, error);
    return { success: false, error: error.message };
  }
}
