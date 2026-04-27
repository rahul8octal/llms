
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>", {
      headers: { "Content-Type": "application/xml" },
    });
  }

  const settings = await prisma.llmSetting.findUnique({
    where: { shop },
    select: { sitemapContent: true, shopifyDomain: true }
  });

  let content = settings?.sitemapContent;

  if (!content) {
    // Generate a basic shopify-style sitemap pointing to the main areas
    const domain = settings?.shopifyDomain || shop;
    content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${domain}/</loc>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>https://${domain}/collections/all</loc>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>https://${domain}/pages/about-us</loc>
    <changefreq>monthly</changefreq>
  </url>
</urlset>`;
  }

  return new Response(content.trim(), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
      "X-Shopify-App-Proxy-No-Layout": "1",
    },
  });
};
