
import { useState } from "react";
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
} from "@shopify/polaris";
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
    <Page 
        title="AI Crawler Settings"
        backAction={{ content: "Overview", onAction: () => navigate("/app") }}
    >
      <BlockStack gap="500">
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 8 }}>
              <Card>
                <BlockStack gap="400">
                  <Text>
                    Choose which AI crawlers can access your LLMs.txt file. This helps control which AI platforms can discover and recommend your products.
                  </Text>
                  <Banner tone="info">
                    <p><strong>Note:</strong> Some AI crawlers may not consistently follow robots.txt directives. This configuration serves as a preference indicator for compliant crawlers.</p>
                  </Banner>
                  
                  {crawlerGroups.map((group) => (
                    <BlockStack gap="300" key={group.title}>
                      <Text variant="headingSm" as="h4">{group.title}</Text>
                      <Grid>
                        {group.items.map((item) => (
                          <Grid.Cell key={item.key} columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4 }}>
                            <Card padding="200">
                              <BlockStack gap="200">
                                <InlineStack align="space-between" blockAlign="center">
                                  <Text fontWeight="bold">{item.label}</Text>
                                  <Checkbox
                                    label=""
                                    checked={selectedCrawlers[item.key]}
                                    onChange={(val) => setSelectedCrawlers({
                                      ...selectedCrawlers,
                                      [item.key]: val
                                    })}
                                  />
                                </InlineStack>
                                <Text variant="bodySm" tone="subdued">{item.desc}</Text>
                              </BlockStack>
                            </Card>
                          </Grid.Cell>
                        ))}
                      </Grid>
                    </BlockStack>
                  ))}
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4 }}>
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="200">
                    <Text variant="headingMd" as="h3">Crawler Status</Text>
                    <InlineStack align="space-between">
                      <Text>Active Crawlers</Text>
                      <Badge tone="info">{Object.values(selectedCrawlers).filter(Boolean).length}</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text>Total Available</Text>
                      <Badge>{Object.keys(selectedCrawlers).length}</Badge>
                    </InlineStack>
                  </BlockStack>
                </Card>
                <Card>
                  <BlockStack gap="200">
                    <Text variant="headingMd" as="h3">Popular Crawlers</Text>
                    <List>
                      <List.Item>ChatGPT (GPTBot)</List.Item>
                      <List.Item>Claude (ClaudeBot)</List.Item>
                      <List.Item>Perplexity AI</List.Item>
                      <List.Item>Google AI (Google-Extended)</List.Item>
                      <List.Item>Bing (BingBot)</List.Item>
                    </List>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Grid.Cell>
          </Grid>
          <InlineStack align="end">
            <Button variant="primary" onClick={handleSave} loading={fetcher.state !== "idle"}>
              Save Crawler Settings
            </Button>
          </InlineStack>
      </BlockStack>
      <Box paddingBlockStart="500"></Box>
    </Page>
  );
}
