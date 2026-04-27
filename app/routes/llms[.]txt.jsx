
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

  const download = url.searchParams.get("download");
  const headers = {
    "Content-Type": "text/plain",
    "Cache-Control": "public, max-age=3600",
  };

  // Log the visit (background, don't await/block the response)
  const userAgent = request.headers.get("user-agent") || "";
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
  
  // Basic crawler detection
  let crawlerName = "Unknown AI";
  if (userAgent.toLowerCase().includes("gptbot")) crawlerName = "ChatGPT";
  else if (userAgent.toLowerCase().includes("claudebot")) crawlerName = "Claude";
  else if (userAgent.toLowerCase().includes("google-extended")) crawlerName = "Gemini";
  else if (userAgent.toLowerCase().includes("perplexity")) crawlerName = "Perplexity";
  else if (userAgent.toLowerCase().includes("bingbot")) crawlerName = "Bing";
  else if (userAgent.toLowerCase().includes("applebot")) crawlerName = "Apple";
  else if (userAgent.toLowerCase().includes("facebookbot") || userAgent.toLowerCase().includes("meta-externalagent")) crawlerName = "Meta";
  else if (userAgent.toLowerCase().includes("ccbot")) crawlerName = "CommonCrawl";
  
  // Save log in background
  prisma.llmLog.create({
    data: {
      shop,
      userAgent,
      ipAddress,
      crawlerName
    }
  }).catch(e => console.error("Failed to log LLM visit", e));

  if (download === "true") {
    headers["Content-Disposition"] = 'attachment; filename="llms.txt"';
  }

  return new Response(llmFile.content, { 
    headers: {
      ...headers,
      "X-Shopify-App-Proxy-No-Layout": "1"
    }
  });
};
