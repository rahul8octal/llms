
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response("Missing shop parameter", { status: 400 });
  }

  let llmFile = await prisma.llmFile.findUnique({ where: { shop } });
  
  if (!llmFile) {
    llmFile = await prisma.llmFile.findFirst();
  }

  if (!llmFile) {
    return new Response("# Store AI Catalog\n\nContent not generated yet.", {
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response(llmFile.content, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
