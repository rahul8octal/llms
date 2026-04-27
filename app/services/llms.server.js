
export function generateLLMsTxt({ store, data, settings }) {
  const { products, collections, blogs, pages } = data;
  const { domain, description } = store;
  
  const {
    includeProducts = true,
    includeCollections = true,
    includeBlogs = true,
    includePages = true,
    productFields = {}
  } = settings;

  let out = `# ${store.name || 'Store'} AI Catalog\n\n`;
  if (description) {
    out += `> ${description}\n\n`;
  }

  out += `Base URL: https://${domain}\n\n`;

  if (includeProducts && products && products.length > 0) {
    out += `## Products\n\n`;
    products.forEach(({ node }) => {
      out += `### ${node.title}\n`;
      out += `- **URL:** https://${domain}/products/${node.handle}\n`;
      out += `- **Price:** ${node.priceRange?.minVariantPrice?.amount} ${node.priceRange?.minVariantPrice?.currencyCode}\n`;
      
      if (productFields.description && node.description) {
        out += `- **Description:** ${node.description.replace(/\n/g, ' ').slice(0, 500)}...\n`;
      }
      if (productFields.vendor && node.vendor) {
        out += `- **Vendor:** ${node.vendor}\n`;
      }
      if (productFields.productType && node.productType) {
        out += `- **Type:** ${node.productType}\n`;
      }
      if (productFields.sku && node.variants?.edges?.[0]?.node?.sku) {
        out += `- **SKU:** ${node.variants.edges[0].node.sku}\n`;
      }
      if (productFields.tags && node.tags?.length > 0) {
        out += `- **Tags:** ${node.tags.join(', ')}\n`;
      }
      
      out += `\n`;
    });
  }

  if (includeCollections && collections && collections.length > 0) {
    out += `## Collections\n\n`;
    collections.forEach(({ node }) => {
      out += `### ${node.title}\n`;
      out += `- **URL:** https://${domain}/collections/${node.handle}\n\n`;
    });
  }

  if (includeBlogs && blogs && blogs.length > 0) {
    out += `## Blog Posts\n\n`;
    blogs.forEach(({ node: blog }) => {
      blog.articles?.edges.forEach(({ node: article }) => {
        out += `### ${article.title}\n`;
        out += `- **URL:** https://${domain}/blogs/${blog.handle}/${article.handle}\n\n`;
      });
    });
  }

  if (includePages && pages && pages.length > 0) {
    out += `## Pages\n\n`;
    pages.forEach(({ node }) => {
      out += `### ${node.title}\n`;
      out += `- **URL:** https://${domain}/pages/${node.handle}\n\n`;
    });
  }

  return out.trim();
}
