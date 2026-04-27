
import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useFetcher,
  useNavigate,
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
  ProductIcon,
  CollectionIcon,
  ChatIcon,
  NoteIcon,
  ClockIcon,
  CheckCircleIcon,
  InfoIcon,
  SearchIcon,
  LocationIcon,
  CalendarIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { syncLLMsFile } from "../services/syncer.server";

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
  } catch (e) { }

  // FETCH ANALYTICS
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const [totalVisits, uniqueCrawlers, uniqueIPs, recentLogs, topCrawlers] = await Promise.all([
    prisma.llmLog.count({ where: { shop } }),
    prisma.llmLog.groupBy({
      by: ['crawlerName'],
      where: { shop },
      _count: true
    }),
    prisma.llmLog.groupBy({
      by: ['ipAddress'],
      where: { shop },
      _count: true
    }),
    prisma.llmLog.count({
      where: {
        shop,
        createdAt: { gte: last7Days }
      }
    }),
    prisma.llmLog.groupBy({
      by: ['crawlerName'],
      where: { shop },
      _count: { crawlerName: true },
      orderBy: { _count: { crawlerName: 'desc' } },
      take: 5
    })
  ]);

  const analytics = {
    totalVisits,
    uniqueCrawlers: uniqueCrawlers.length,
    uniqueIPs: uniqueIPs.length,
    recentActivity: recentLogs,
    topCrawlers: topCrawlers.map(c => ({ name: c.crawlerName, count: c._count.crawlerName }))
  };

  return json({ settings, lastUpdated: llmFile?.updatedAt || null, stats, shop, analytics });
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const result = await syncLLMsFile(admin, shop);
    return json(result);
  } catch (error) {
    return json({ success: false, error: error.message });
  }
};

export default function AppIndex() {
  const { settings, lastUpdated, stats, shop, analytics } = useLoaderData();
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

  const navigate = useNavigate();
  const storeViewUrl = `https://${shop}/tools/llms/llms.txt`;
  const physicalFileUrl = `/llms-files/llms-${shop}.txt`;

  return (
    <Frame>
      <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
        <BlockStack gap="600">
          {/* Hero Section */}
          <div className="llm-hero-card">
            <BlockStack gap="500">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingXl" as="h1" tone="inherit">
                  Get discovered by AI
                </Text>
                <div className="llm-badge-pulse" style={{ backgroundColor: "#22c55e", borderRadius: "20px", padding: "4px 12px" }}>
                  <InlineStack gap="100" blockAlign="center">
                    <Icon source={CheckCircleIcon} tone="inherit" />
                    <Text variant="bodySm" fontWeight="bold" tone="inherit">Connected</Text>
                  </InlineStack>
                </div>
              </InlineStack>

              <Text variant="bodyLg" as="p" tone="inherit" style={{ opacity: 0.9, maxWidth: "800px" }}>
                Generate an optimized llms.txt file to help AI assistants like ChatGPT,
                Perplexity, and Gemini discover your products and recommend them to users.
              </Text>

              <InlineStack align="space-between" blockAlign="end">
                <fetcher.Form method="post">
                  <Button variant="primary" size="large" submit loading={fetcher.state !== "idle"}>
                    Generate LLMs.txt
                  </Button>
                </fetcher.Form>
                <Button size="large" icon={ExternalIcon} url={physicalFileUrl} target="_blank">
                  Preview File
                </Button>
              </InlineStack>
            </BlockStack>
          </div>

          <div className="llm-info-grid">
            <BlockStack gap="500">
              {/* Content Inventory Section */}
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Content Inventory for AI Indexing</Text>
                <div className="llm-stat-grid">
                  <div className="llm-stat-box">
                    <InlineStack align="space-between" blockAlign="center">
                      <div className="llm-stat-icon-wrapper"><Icon source={ProductIcon} tone="brand" /></div>
                      <Text variant="headingLg" as="p">{stats.products}</Text>
                    </InlineStack>
                    <BlockStack gap="100">
                      <Text variant="bodyMd" fontWeight="bold">Products</Text>
                      <Text variant="bodySm" tone="subdued">Active inventory</Text>
                    </BlockStack>
                  </div>
                  <div className="llm-stat-box">
                    <InlineStack align="space-between" blockAlign="center">
                      <div className="llm-stat-icon-wrapper"><Icon source={CollectionIcon} tone="brand" /></div>
                      <Text variant="headingLg" as="p">{stats.collections}</Text>
                    </InlineStack>
                    <BlockStack gap="100">
                      <Text variant="bodyMd" fontWeight="bold">Collections</Text>
                      <Text variant="bodySm" tone="subdued">Categories</Text>
                    </BlockStack>
                  </div>
                  <div className="llm-stat-box">
                    <InlineStack align="space-between" blockAlign="center">
                      <div className="llm-stat-icon-wrapper"><Icon source={ChatIcon} tone="brand" /></div>
                      <Text variant="headingLg" as="p">{stats.blogs}</Text>
                    </InlineStack>
                    <BlockStack gap="100">
                      <Text variant="bodyMd" fontWeight="bold">Blogs</Text>
                      <Text variant="bodySm" tone="subdued">Indexed articles</Text>
                    </BlockStack>
                  </div>
                  <div className="llm-stat-box">
                    <InlineStack align="space-between" blockAlign="center">
                      <div className="llm-stat-icon-wrapper"><Icon source={NoteIcon} tone="brand" /></div>
                      <Text variant="headingLg" as="p">{stats.pages}</Text>
                    </InlineStack>
                    <BlockStack gap="100">
                      <Text variant="bodyMd" fontWeight="bold">Pages</Text>
                      <Text variant="bodySm" tone="subdued">Informational</Text>
                    </BlockStack>
                  </div>
                </div>
              </BlockStack>
              {/* AI VISIBILITY ANALYTICS */}
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">AI Visibility Analytics</Text>
                <div className="llm-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div className="llm-stat-box">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="bodyMd" fontWeight="bold">Total Visits</Text>
                      <Icon source={ViewIcon} tone="subdued" />
                    </InlineStack>
                    <Text variant="headingXl" as="p">{analytics.totalVisits}</Text>
                    <Text variant="bodySm" tone="subdued">All-time crawler visits</Text>
                  </div>
                  <div className="llm-stat-box">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="bodyMd" fontWeight="bold">Unique Crawlers</Text>
                      <Icon source={SearchIcon} tone="subdued" />
                    </InlineStack>
                    <Text variant="headingXl" as="p">{analytics.uniqueCrawlers}</Text>
                    <Text variant="bodySm" tone="subdued">Different AI platforms</Text>
                  </div>
                  <div className="llm-stat-box">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="bodyMd" fontWeight="bold">Unique IPs</Text>
                      <Icon source={LocationIcon} tone="subdued" />
                    </InlineStack>
                    <Text variant="headingXl" as="p">{analytics.uniqueIPs}</Text>
                    <Text variant="bodySm" tone="subdued">Source addresses</Text>
                  </div>
                  <div className="llm-stat-box">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="bodyMd" fontWeight="bold">Recent Activity</Text>
                      <Badge tone="success">7 days</Badge>
                    </InlineStack>
                    <Text variant="headingXl" as="p">{analytics.recentActivity}</Text>
                    <Text variant="bodySm" tone="subdued">Visits in last week</Text>
                  </div>
                </div>

                <Card>
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3">Top AI Crawlers</Text>
                    {analytics.topCrawlers.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {analytics.topCrawlers.map((crawler) => (
                          <div key={crawler.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <InlineStack gap="300" blockAlign="center">
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--llm-primary)' }}></div>
                              <Text variant="bodyMd" fontWeight="bold">{crawler.name}</Text>
                            </InlineStack>
                            <InlineStack gap="200" blockAlign="center">
                              <div style={{
                                height: '8px',
                                width: '100px',
                                backgroundColor: '#f1f5f9',
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${(crawler.count / analytics.totalVisits) * 100}%`,
                                  backgroundColor: 'var(--llm-primary)',
                                  borderRadius: '4px'
                                }}></div>
                              </div>
                              <Text variant="bodySm" fontWeight="bold">{crawler.count} visits</Text>
                            </InlineStack>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        heading="No crawler activity yet"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>Generate your LLMs.txt file to start attracting AI crawlers.</p>
                      </EmptyState>
                    )}
                  </BlockStack>
                </Card>
              </BlockStack>
            </BlockStack>

            <BlockStack gap="400">
              {/* Sync Info - The most important side info */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text variant="headingMd" as="h3">Sync Status</Text>
                    <Badge tone={lastUpdated ? "success" : "caution"}>
                      {lastUpdated ? "Active" : "Ready"}
                    </Badge>
                  </InlineStack>

                  <BlockStack gap="200">
                    <Text variant="bodySm" tone="subdued">Public Endpoint:</Text>
                    <div className="llm-link-card" style={{ padding: '10px', fontSize: '11px', background: '#f1f5f9' }}>
                      {storeViewUrl}
                    </div>
                  </BlockStack>

                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="100" blockAlign="center">
                      <Icon source={ClockIcon} tone="subdued" />
                      <Text variant="bodySm" tone="subdued">
                        {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Pending"}
                      </Text>
                    </InlineStack>
                    <Button icon={ArrowDownIcon} url={physicalFileUrl} target="_blank" variant="tertiary" size="slim">
                      Download
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>

              {/* Management Tools */}
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h3">Quick Actions</Text>
                  <BlockStack gap="200">
                    <Button fullWidth icon={ExternalIcon} onClick={() => navigate("/app/configuration")}>
                      LLM Metadata Settings
                    </Button>
                    <Button fullWidth icon={ExternalIcon} onClick={() => navigate("/app/crawlers")}>
                      AI Crawler Settings
                    </Button>
                  </BlockStack>
                </BlockStack>
              </Card>

              {/* Discovery Insights - Combined platform and readiness */}
              <Card background="bg-surface-brand-subdued">
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text variant="headingMd" as="h3">Search Discovery</Text>
                    <Text variant="bodySm" tone="subdued">
                      Your store is optimized for the following AI platforms and search engines.
                    </Text>
                  </BlockStack>

                  <Box paddingBlock="200" borderBlockStartWidth="025" borderColor="border-brand-subdued">
                    <BlockStack gap="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text variant="bodySm" tone="subdued">ChatGPT / OpenAI</Text>
                        <Text variant="bodySm" tone="success" fontWeight="bold">Optimized</Text>
                      </InlineStack>
                      <InlineStack align="space-between" blockAlign="center">
                        <Text variant="bodySm" tone="subdued">Claude / Gemini</Text>
                        <Text variant="bodySm" tone="success" fontWeight="bold">Ready</Text>
                      </InlineStack>
                      <InlineStack align="space-between" blockAlign="center">
                        <Text variant="bodySm" tone="subdued">Metadata Density</Text>
                        <Badge tone="success" size="small">High</Badge>
                      </InlineStack>
                    </BlockStack>
                  </Box>
                </BlockStack>
              </Card>

              {/* Tips */}
              <div style={{ padding: '16px', borderRadius: '12px', border: '1px dashed #cbd5e1', backgroundColor: '#fcfcfc' }}>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                      <Icon source={InfoIcon} tone="info" />
                      <Text variant="headingSm" as="h4">Pro Tip</Text>
                    </InlineStack>
                  </InlineStack>
                  <Text variant="bodySm" tone="subdued">
                    Update your store description in Configuration to help AI bots understand your brand's unique value proposition.
                  </Text>
                </BlockStack>
              </div>
            </BlockStack>
          </div>
        </BlockStack>
      </div>
      {toastActive && <Toast content={toastContent} error={toastError} onDismiss={() => setToastActive(false)} />}
    </Frame>
  );
}
