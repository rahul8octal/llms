
import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useFetcher,
} from "@remix-run/react";
import {
  Page,
  Card,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Grid,
  Badge,
  Icon,
  EmptyState,
  Toast,
  Frame,
} from "@shopify/polaris";
import {
  ViewIcon,
  ArrowDownIcon,
  ExternalIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getProducts, getCollections, getBlogs, getPages } from "../models/shopify.server";
import { generateLLMsTxt } from "../services/llms.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const settings = await prisma.llmSetting.findUnique({
    where: { shop },
  });

  const llmFile = await prisma.llmFile.findUnique({
    where: { shop },
    select: { updatedAt: true },
  });

  // ROBUST STATS (REST + GRAPHQL fallback)
  let stats = { products: 0, collections: 0, blogs: 0, pages: 0 };
  try {
    const getCount = (val) => {
        if (typeof val === 'number') return val;
        if (val && typeof val.count === 'number') return val.count;
        return 0;
    };
    
    // REST is usually most consistent for simple counts
    const [p, cc, sc, b, pg] = await Promise.all([
      admin.rest.resources.Product.count({ session }).catch(() => 0),
      admin.rest.resources.CustomCollection.count({ session }).catch(() => 0),
      admin.rest.resources.SmartCollection.count({ session }).catch(() => 0),
      admin.rest.resources.Blog.count({ session }).catch(() => 0),
      admin.rest.resources.Page.count({ session }).catch(() => 0),
    ]);
    
    stats = {
      products: getCount(p),
      collections: getCount(cc) + getCount(sc),
      blogs: getCount(b),
      pages: getCount(pg)
    };
    
    // Final check: if everything is 0 but we know there's content, use GraphQL fallback
    if (stats.products === 0) {
       const gqlRes = await admin.graphql(`query { products(first:1){ totalCount } }`);
       const gqlData = await gqlRes.json();
       if (gqlData.data?.products?.totalCount) stats.products = gqlData.data.products.totalCount;
    }
  } catch (e) {}

  return json({ settings, lastUpdated: llmFile?.updatedAt || null, stats, shop });
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  
  try {
    const settings = await prisma.llmSetting.findUnique({ where: { shop } });
    if (!settings) return json({ success: false, error: "Settings not found" }, { status: 404 });

    const [products, collections, blogs, pages] = await Promise.all([
      getProducts(admin),
      getCollections(admin),
      getBlogs(admin),
      getPages(admin),
    ]);

    const content = generateLLMsTxt({
      store: {
        name: settings.storeName || shop.split(".")[0],
        domain: settings.shopifyDomain,
        description: settings.description || "AI-optimized product catalog",
      },
      data: { products, collections, blogs, pages },
      settings
    });

    await prisma.llmFile.upsert({
      where: { shop },
      update: { content, updatedAt: new Date() },
      create: { shop, content },
    });

    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: error.message });
  }
};

export default function AppIndex() {
  const { settings, lastUpdated, stats, shop } = useLoaderData();
  const fetcher = useFetcher();
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");
  const [toastError, setToastError] = useState(false);

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        setToastContent("File generated and saved successfully!");
        setToastError(false);
        setToastActive(true);
      } else if (fetcher.data.success === false) {
        setToastContent(fetcher.data.error || "Generation failed");
        setToastError(true);
        setToastActive(true);
      }
    }
  }, [fetcher.data]);

  const storeViewUrl = `https://${shop}/tools/llms/llms.txt`;

  return (
    <Frame>
      <Page title="Overview">
        <BlockStack gap="500">
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">Generate LLMs.txt (v5.5)</Text>
                  <Text variant="bodyMd" tone="subdued">Deep API Syncing Enabled.</Text>
                </BlockStack>
                <Badge tone="success">Connected</Badge>
              </InlineStack>

              <fetcher.Form method="post">
                <InlineStack gap="300">
                  <Button variant="primary" submit loading={fetcher.state !== "idle"}>
                     Generate LLMs.txt
                  </Button>
                  <Button icon={ExternalIcon} url={storeViewUrl} target="_blank">
                    View Public File
                  </Button>
                  <Button icon={ArrowDownIcon} url={`${storeViewUrl}?download=true`} target="_blank">
                    Download
                  </Button>
                </InlineStack>
              </fetcher.Form>

              <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                <Text variant="bodySm" fontWeight="bold" tone={lastUpdated ? "success" : "caution"}>
                   {lastUpdated ? "● Database Persistent" : "● Action Required"}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Never"}
                </Text>
              </Box>
            </BlockStack>
          </Card>

          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4 }}>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Content Statistics</Text>
                  <InlineStack align="space-between"><Text>Products</Text><Badge tone="info">{stats.products}</Badge></InlineStack>
                  <InlineStack align="space-between"><Text>Collections</Text><Badge tone="info">{stats.collections}</Badge></InlineStack>
                  <InlineStack align="space-between"><Text>Blog Posts</Text><Badge tone="info">{stats.blogs}</Badge></InlineStack>
                  <InlineStack align="space-between"><Text>Pages</Text><Badge tone="info">{stats.pages}</Badge></InlineStack>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 8 }}>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Sync Information</Text>
                  <Text variant="bodyMd">Store: <Text fontWeight="bold">{shop}</Text></Text>
                  <Text variant="bodyMd" tone="subdued">Direct Access URL:</Text>
                  <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                    <Text variant="bodySm" fontWeight="bold">{storeViewUrl}</Text>
                  </Box>
                  <Text variant="bodySm" tone="subdued">If the file looks empty, try generating again to refresh the proxy cache.</Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </BlockStack>
      </Page>
      {toastActive && <Toast content={toastContent} error={toastError} onDismiss={() => setToastActive(false)} />}
    </Frame>
  );
}
