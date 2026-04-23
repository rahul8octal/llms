
export async function getProducts(admin, limit = 50) {
  try {
    const response = await admin.graphql(`
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    `, {
      variables: { first: limit }
    });
    const json = await response.json();
    return json.data?.products?.edges || [];
  } catch (e) {
    console.error("Products fetch failed:", e);
    return [];
  }
}

export async function getCollections(admin, limit = 50) {
  try {
    const response = await admin.graphql(`
      query getCollections($first: Int!) {
        collections(first: $first) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    `, {
      variables: { first: limit }
    });
    const json = await response.json();
    return json.data?.collections?.edges || [];
  } catch (e) {
    console.error("Collections fetch failed:", e);
    return [];
  }
}

export async function getBlogs(admin, limit = 20) {
  try {
    const response = await admin.graphql(`
      query getBlogs($first: Int!) {
        blogs(first: $first) {
          edges {
            node {
              id
              title
              handle
              articles(first: 10) {
                edges {
                  node {
                    id
                    title
                    handle
                  }
                }
              }
            }
          }
        }
      }
    `, {
      variables: { first: limit }
    });
    const json = await response.json();
    if (json.errors) return []; // Skip if restricted
    return json.data?.blogs?.edges || [];
  } catch (e) {
    return [];
  }
}

export async function getPages(admin, limit = 20) {
  try {
    const response = await admin.graphql(`
      query getPages($first: Int!) {
        pages(first: $first) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    `, {
      variables: { first: limit }
    });
    const json = await response.json();
    if (json.errors) return []; // Skip if restricted
    return json.data?.pages?.edges || [];
  } catch (e) {
    return [];
  }
}
