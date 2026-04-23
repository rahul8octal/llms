
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const llmFile = await prisma.llmFile.findUnique({
    where: { shop },
  });

  if (!llmFile) {
    return new Response("LLMs.txt not generated yet", { status: 404 });
  }

  return new Response(llmFile.content, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": 'attachment; filename="llms.txt"',
    },
  });
};
