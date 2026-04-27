
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { syncLLMsFile } from "../services/syncer.server";

export const action = async ({ request }) => {
  const { shop, topic, admin } = await authenticate.webhook(request);
  
  console.log(`Received ${topic} webhook for ${shop}`);

  // Check if auto-sync is enabled for this shop
  const settings = await prisma.llmSetting.findUnique({
    where: { shop },
    select: { autoGenerate: true }
  });

  if (settings?.autoGenerate) {
    console.log(`[AutoSync] Triggered by ${topic} for ${shop}. Updating file...`);
    try {
      await syncLLMsFile(admin, shop);
    } catch (e) {
      console.error(`[AutoSync] Error during sync for ${shop}:`, e);
    }
  } else {
    console.log(`[AutoSync] Disabled for ${shop}. Skipping update.`);
  }

  return new Response(null, { status: 200 });
};
