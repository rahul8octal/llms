
export function generateLLMsTxt(data, settings) {
  const { products, collections, blogs, pages } = data;
  const { 
    storeName, 
    customDomain, 
    shopifyDomain, 
    description,
    includeProducts,
    includeCollections,
    includeBlogs,
    includePages,
    productFields = {}
  } = settings;

  const domain = customDomain || shopifyDomain;
  let output = `# ${storeName || 'Store'} AI Catalog\n\n`;

  if (description) {
    output += `> ${description}\n\n`;
  }

  output += `Base URL: https://${domain}\n\n`;

  if (includeProducts && products && products.length > 0) {
    output += `## Products\n\n`;
    products.forEach(({ node }) => {
      output += `### ${node.title}\n`;
      output += `- **URL:** https://${domain}/products/${node.handle}\n`;
      output += `- **Price:** ${node.priceRange?.minVariantPrice?.amount} ${node.priceRange?.minVariantPrice?.currencyCode}\n`;
      
      if (productFields.description && node.description) {
        output += `- **Description:** ${node.description.replace(/\n/g, ' ')}\n`;
      }
      if (productFields.vendor && node.vendor) {
        output += `- **Brand:** ${node.vendor}\n`;
      }
      if (productFields.productType && node.productType) {
        output += `- **Category:** ${node.productType}\n`;
      }
      if (productFields.tags && node.tags && node.tags.length > 0) {
        output += `- **Tags:** ${node.tags.join(', ')}\n`;
      }
      if (productFields.sku && node.variants?.edges[0]?.node?.sku) {
        output += `- **SKU:** ${node.variants.edges[0].node.sku}\n`;
      }
      if (productFields.availabilityStatus) {
        const available = node.variants?.edges.some(v => v.node.availableForSale);
        output += `- **Status:** ${available ? 'In Stock' : 'Out of Stock'}\n`;
      }
      
      output += `\n`;
    });
  }

  if (includeCollections && collections && collections.length > 0) {
    output += `## Collections\n\n`;
    collections.forEach(({ node }) => {
      output += `### ${node.title}\n`;
      output += `- **URL:** https://${domain}/collections/${node.handle}\n`;
      if (node.description) {
        output += `- **Description:** ${node.description}\n`;
      }
      output += `- **Items:** ${node.productsCount?.count || 0}\n\n`;
    });
  }

  if (includeBlogs && blogs && blogs.length > 0) {
    output += `## Blog Posts\n\n`;
    blogs.forEach(({ node: blog }) => {
      blog.articles?.edges.forEach(({ node: article }) => {
        output += `### ${article.title}\n`;
        output += `- **URL:** https://${domain}/blogs/${blog.handle}/${article.handle}\n`;
        output += `- **Blog:** ${blog.title}\n`;
        output += `\n`;
      });
    });
  }

  if (includePages && pages && pages.length > 0) {
    output += `## Information Pages\n\n`;
    pages.forEach(({ node }) => {
      output += `### ${node.title}\n`;
      output += `- **URL:** https://${domain}/pages/${node.handle}\n`;
      output += `\n`;
    });
  }

  return output.trim();
}
