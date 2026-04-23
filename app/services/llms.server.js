
export function generateLLMsTxt({ store, data, settings }) {
  const { products, collections, blogs, pages } = data;
  const { domain, description } = store;
  
  let out = `# ${store.name || 'Store'} AI Catalog\n\n`;
  if (description) {
    out += `> ${description}\n\n`;
  }

  out += `Base URL: https://${domain}\n\n`;

  if (products && products.length > 0) {
    out += `## Products\n\n`;
    products.forEach(({ node }) => {
      out += `### ${node.title}\n`;
      out += `- **URL:** https://${domain}/products/${node.handle}\n`;
      out += `- **Price:** ${node.priceRange?.minVariantPrice?.amount} ${node.priceRange?.minVariantPrice?.currencyCode}\n`;
      if (node.description) {
        out += `- **Description:** ${node.description.replace(/\n/g, ' ').slice(0, 140)}...\n`;
      }
      out += `\n`;
    });
  }

  if (collections && collections.length > 0) {
    out += `## Collections\n\n`;
    collections.forEach(({ node }) => {
      out += `### ${node.title}\n`;
      out += `- **URL:** https://${domain}/collections/${node.handle}\n\n`;
    });
  }

  if (blogs && blogs.length > 0) {
    out += `## Blog Posts\n\n`;
    blogs.forEach(({ node: blog }) => {
      blog.articles?.edges.forEach(({ node: article }) => {
        out += `### ${article.title}\n`;
        out += `- **URL:** https://${domain}/blogs/${blog.handle}/${article.handle}\n\n`;
      });
    });
  }

  return out.trim();
}
