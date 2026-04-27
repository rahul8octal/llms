
import { useState, useCallback, useEffect } from "react";
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
  Checkbox,
  Grid,
  Badge,
  Banner,
  List,
  Icon,
  Toast,
  Frame,
} from "@shopify/polaris";
import { 
  InfoIcon,
  SearchIcon,
  LockIcon,
  ViewIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  let settings = await prisma.llmSetting.findUnique({
    where: { shop },
  });

  if (!settings) {
    // Should already exist by now, but just in case
    return json({ settings: { selectedCrawlers: {} } });
  }

  return json({ settings });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  
  const selectedCrawlers = JSON.parse(formData.get("selectedCrawlers"));

  await prisma.llmSetting.update({
    where: { shop },
    data: { selectedCrawlers },
  });

  return json({ success: true });
};

export default function Crawlers() {
  const { settings } = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const [selectedCrawlers, setSelectedCrawlers] = useState(settings.selectedCrawlers || {});
  const [toastActive, setToastActive] = useState(false);

  useEffect(() => {
    if (fetcher.data && fetcher.data.success) {
      setToastActive(true);
    }
  }, [fetcher.data]);

  const toggleToastActive = useCallback(() => setToastActive((active) => !active), []);

  const handleSave = () => {
    const formData = new FormData();
    formData.append("selectedCrawlers", JSON.stringify(selectedCrawlers));
    fetcher.submit(formData, { method: "post" });
  };

  const crawlerGroups = [
    {
      title: "Core AI Assistants",
      items: [
        { label: "ChatGPT (OpenAI)", key: "chatgpt", desc: "GPTBot, ChatGPT-User, OAI-SearchBot" },
        { label: "Claude (Anthropic)", key: "claude", desc: "ClaudeBot, anthropic-ai, claude-web" },
        { label: "Gemini (Google)", key: "gemini", desc: "Google-Extended" },
        { label: "Perplexity AI", key: "perplexity", desc: "PerplexityBot, Perplexity-User" },
        { label: "Grok (X)", key: "grok", desc: "Future X AI crawler" },
        { label: "DeepSeek", key: "deepseek", desc: "DeepSeek-Chat" },
        { label: "Mistral AI (Le Chat)", key: "mistral", desc: "MistralAI-User" },
      ]
    },
    {
      title: "Major Tech Companies",
      items: [
        { label: "Bing (Microsoft)", key: "bing", desc: "BingBot for Copilot" },
        { label: "Amazon (Alexa)", key: "amazon", desc: "Amazonbot" },
        { label: "Apple (Siri)", key: "apple", desc: "Applebot, Applebot-Extended" },
        { label: "Meta (Facebook/Instagram)", key: "meta", desc: "FacebookBot, meta-externalagent" },
        { label: "ByteDance (TikTok)", key: "bytedance", desc: "Bytespider" },
      ]
    },
    {
      title: "Specialized AI & Research",
      items: [
        { label: "DuckDuckGo (DuckAssist)", key: "duckduckgo", desc: "DuckAssistBot" },
        { label: "Cohere AI", key: "cohere", desc: "cohere-ai" },
        { label: "Research & Open Source", key: "commoncrawl", desc: "AI2Bot, CCBot" },
      ]
    }
  ];

  return (
    <Frame>
      <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
        <Page 
            fullWidth
            title="AI Crawler Settings"
            backAction={{ content: "Overview", onAction: () => navigate("/app") }}
            primaryAction={{
              content: "Save Crawler Settings",
              loading: fetcher.state !== "idle",
              onAction: handleSave,
            }}
        >
        <BlockStack gap="600">
          <div className="llm-premium-banner">
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="400" blockAlign="center">
                  <div style={{ backgroundColor: 'var(--llm-primary)', padding: '12px', borderRadius: '12px', color: 'white', display: 'flex', boxShadow: '0 4px 12px rgba(92, 106, 196, 0.2)' }}>
                    <Icon source={LockIcon} />
                  </div>
                  <BlockStack gap="100">
                    <Text variant="headingLg" as="h2">Manage AI Visibility</Text>
                    <Text variant="bodyLg" tone="subdued">
                      Optimize your store's presence in AI search results by controlling specific platforms.
                    </Text>
                  </BlockStack>
                </InlineStack>
                <div style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #dcfce7', background: '#f0fdf4' }}>
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)' }}></div>
                    <Text variant="bodySm" fontWeight="bold" tone="success">Robots.txt Active</Text>
                  </InlineStack>
                </div>
              </InlineStack>
              
              <Box padding="400" background="bg-surface-info-subdued" borderRadius="300" borderStyle="solid" borderWidth="025" borderColor="border-info-subdued">
                <InlineStack gap="300" blockAlign="center" align="space-between">
                  <InlineStack gap="300" blockAlign="center">
                    <Icon source={InfoIcon} tone="info" />
                    <Text variant="bodyMd" tone="info">
                      AI giants like OpenAI, Google, and Bing strictly respect these directives. Experimental crawlers may vary in compliance.
                    </Text>
                  </InlineStack>
                </InlineStack>
              </Box>
            </BlockStack>
          </div>

          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 8 }}>
              <BlockStack gap="600">
                {crawlerGroups.map((group) => (
                  <div key={group.title}>
                    <div className="llm-section-header">
                      <Text variant="headingSm" tone="subdued">{group.title}</Text>
                    </div>
                    <Grid>
                      {group.items.map((item) => (
                        <Grid.Cell key={item.key} columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6 }}>
                          <div 
                            className={`llm-crawler-card ${selectedCrawlers[item.key] ? 'active' : ''}`}
                            onClick={() => setSelectedCrawlers({
                              ...selectedCrawlers,
                              [item.key]: !selectedCrawlers[item.key]
                            })}
                          >
                            <InlineStack align="space-between" blockAlign="center">
                              <Text fontWeight="bold">{item.label}</Text>
                              <Checkbox
                                label=""
                                checked={selectedCrawlers[item.key]}
                                onChange={() => {}} // Handled by div click
                              />
                            </InlineStack>
                            <Text variant="bodySm" tone="subdued">{item.desc}</Text>
                          </div>
                        </Grid.Cell>
                      ))}
                    </Grid>
                  </div>
                ))}
              </BlockStack>
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, sm: 2, md: 2, lg: 4 }}>
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="400">
                    <div className="llm-section-header">
                      <Icon source={ViewIcon} tone="brand" />
                      <Text variant="headingMd" as="h3">System Analytics</Text>
                    </div>
                    
                    <BlockStack gap="300">
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        backgroundColor: '#f8fafc',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <Text variant="bodyMd">Permitted Crawlers</Text>
                        <Badge tone="success">{Object.values(selectedCrawlers).filter(Boolean).length}</Badge>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <Text variant="bodyMd">Blocked Crawlers</Text>
                        <Badge tone="warning">{Object.keys(selectedCrawlers).length - Object.values(selectedCrawlers).filter(Boolean).length}</Badge>
                      </div>
                    </BlockStack>

                    <div style={{ 
                      backgroundColor: 'var(--p-color-bg-surface-brand-subdued)', 
                      padding: '12px', 
                      borderRadius: '8px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontSize: '20px' }}>⚡</div>
                      <Text variant="bodySm" tone="brand">
                        Updates apply to your robots.txt dynamically.
                      </Text>
                    </div>
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap="400">
                    <div className="llm-section-header">
                      <Icon source={SearchIcon} tone="brand" />
                      <Text variant="headingMd" as="h3">Popular Agents</Text>
                    </div>
                    
                    <BlockStack gap="300">
                      {[
                        { bot: "GPTBot", platform: "ChatGPT" },
                        { bot: "ClaudeBot", platform: "Claude.ai" },
                        { bot: "Google-Extended", platform: "Gemini" }
                      ].map((item) => (
                        <div key={item.bot} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Badge tone="info">{item.bot}</Badge>
                          <Text variant="bodySm" tone="subdued">{item.platform}</Text>
                        </div>
                      ))}
                    </BlockStack>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Grid.Cell>
          </Grid>
        </BlockStack>
      </Page>
    </div>
    {toastActive && (
      <Toast content="Crawler settings saved" onDismiss={toggleToastActive} />
    )}
  </Frame>
);
}
