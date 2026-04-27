
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { syncLLMsFile } from "../services/syncer.server";

export const action = async ({ request }) => {
  const { shop, topic, admin } = await authenticate.webhook(request);
  
  console.log(`Received ${topic} webhook for ${shop}`);

  // Check if auto-generation is enabled
  const settings = await prisma.llmSetting.findUnique({
    where: { shop },
    select: { autoGenerate: true }
  });

  if (settings?.autoGenerate) {
    console.log(`[Webhook] Auto-generation enabled for ${shop}. Syncing...`);
    await syncLLMsFile(admin, shop);
  } else {
    console.log(`[Webhook] Auto-generation disabled for ${shop}. Skipping sync.`);
  }

  return new Response(null, { status: 200 });
};
