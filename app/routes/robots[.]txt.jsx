import prisma from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response("User-agent: *\nDisallow: /admin/", {
      headers: { "Content-Type": "text/plain" },
    });
  }

  const settings = await prisma.llmSetting.findUnique({
    where: { shop },
    select: { robotsContent: true, shopifyDomain: true }
  });

  let content = settings?.robotsContent;

  if (!content) {
    const domain = settings?.shopifyDomain || shop;
    content = `User-agent: *
Disallow: /admin/
Disallow: /cart/
Disallow: /checkout/
Disallow: /orders/
Disallow: /checkouts/
Disallow: /account/
Disallow: /search/
Disallow: /apple-app-site-association
Disallow: /.well-known/

# AI Crawler Policy
User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

Sitemap: https://${domain}/sitemap.xml
Sitemap: https://${domain}/tools/llms/sitemap.xml`;
  }

  return new Response(content.trim(), {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
      "X-Shopify-App-Proxy-No-Layout": "1",
    },
  });
};
