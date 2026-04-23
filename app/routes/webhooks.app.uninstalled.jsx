
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    // Cleanup new LLM models
    await db.llmFile.deleteMany({ where: { shop } });
    await db.llmSetting.deleteMany({ where: { shop } });
    await db.llmLog.deleteMany({ where: { shop } });
    
    // Cleanup sessions
    await db.session.deleteMany({ where: { shop } });

    console.log(`[Uninstall] Cleanup completed for ${shop}`);
  } catch (error) {
    console.error(`[Uninstall] Cleanup failed for ${shop}:`, error);
  }

  return new Response(null, { status: 200 });
};
