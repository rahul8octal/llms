import { useState, useCallback, useEffect } from "react";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useFetcher,
  useNavigate,
  Link,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Box,
  TextField,
  Checkbox,
  Grid,
  Banner,
  Toast,
  Frame,
  Icon,
  Badge,
} from "@shopify/polaris";
import {
  SearchIcon,
  ProductIcon,
  ViewIcon,
  SettingsIcon,
  CheckCircleIcon,
  InfoIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { start } from "node:repl";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  let settings = await prisma.llmSetting.findUnique({
    where: { shop },
  });

  if (!settings) {
     // Default settings creation logic
     settings = await prisma.llmSetting.create({
      data: {
        shop,
        storeName: shop.split(".")[0],
        shopifyDomain: shop,
        includeProducts: true,
        includeCollections: true,
        includeBlogs: true,
        includePages: true,
        productFields: {
          description: true, vendor: true, productType: true, tags: true,
          sku: false, barcode: false, availabilityStatus: true,
          compareAtPrice: false, inventoryQuantity: false, productOptions: false,
          productImages: false, seoTitle: false, seoDescription: false,
          creationDate: false, lastUpdated: false,
        },
        selectedCrawlers: {
          chatgpt: true, claude: true, gemini: true, perplexity: true,
          grok: true, deepseek: true, mistral: true, bing: true,
          amazon: false, apple: false, meta: true, bytedance: false,
          duckduckgo: true, cohere: false, commoncrawl: true,
        },
      },
    });
  }

  return json({ settings });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "saveSettings") {
    const storeName = formData.get("storeName");
    const customDomain = formData.get("customDomain");
    const description = formData.get("description");
    const includeProducts = formData.get("includeProducts") === "true";
    const includeCollections = formData.get("includeCollections") === "true";
    const includeBlogs = formData.get("includeBlogs") === "true";
    const includePages = formData.get("includePages") === "true";
    const autoGenerate = formData.get("autoGenerate") === "true";
    
    const productFields = JSON.parse(formData.get("productFields"));

    await prisma.llmSetting.update({
      where: { shop },
      data: {
        storeName,
        customDomain,
        description,
        includeProducts,
        includeCollections,
        includeBlogs,
        includePages,
        autoGenerate,
        productFields,
      },
    });

    return json({ success: true, message: "Settings saved successfully" });
  }

  return json({ success: false });
};

export default function Configuration() {
  const { settings } = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    storeName: settings.storeName || "",
    customDomain: settings.customDomain || "",
    description: settings.description || "",
    includeProducts: settings.includeProducts,
    includeCollections: settings.includeCollections,
    includeBlogs: settings.includeBlogs,
    includePages: settings.includePages,
    autoGenerate: settings.autoGenerate,
    productFields: settings.productFields || {},
  });
  const [toastActive, setToastActive] = useState(false);

  useEffect(() => {
    if (fetcher.data && fetcher.data.success) {
      setToastActive(true);
    }
  }, [fetcher.data]);

  const toggleToastActive = useCallback(() => setToastActive((active) => !active), []);

  const handleSave = () => {
    const formData = new FormData();
    formData.append("actionType", "saveSettings");
    formData.append("storeName", formState.storeName);
    formData.append("customDomain", formState.customDomain);
    formData.append("description", formState.description);
    formData.append("includeProducts", formState.includeProducts);
    formData.append("includeCollections", formState.includeCollections);
    formData.append("includeBlogs", formState.includeBlogs);
    formData.append("includePages", formState.includePages);
    formData.append("autoGenerate", formState.autoGenerate);
    formData.append("productFields", JSON.stringify(formState.productFields));
    fetcher.submit(formData, { method: "post" });
  };

  const productFieldOptions = [
    { label: "Description", key: "description" },
    { label: "Vendor/Brand", key: "vendor" },
    { label: "Product Type/Category", key: "productType" },
    { label: "Tags", key: "tags" },
    { label: "Availability Status", key: "availabilityStatus" },
    { label: "SKU", key: "sku" },
    { label: "Barcode", key: "barcode" },
    { label: "Compare at Price", key: "compareAtPrice" },
    { label: "Inventory Quantity", key: "inventoryQuantity" },
    { label: "Product Options", key: "productOptions" },
    { label: "Product Images", key: "productImages" },
    { label: "SEO Title", key: "seoTitle" },
    { label: "SEO Description", key: "seoDescription" },
    { label: "Creation Date", key: "creationDate" },
    { label: "Last Updated", key: "lastUpdated" },
  ];

  return (
    <Frame>
      <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
        <Page 
            fullWidth
            title="Configuration"
            backAction={{ content: "Overview", onAction: () => navigate("/app") }}
            primaryAction={{
              content: "Save Settings",
              loading: fetcher.state !== "idle",
              onAction: handleSave,
            }}
        >
        <BlockStack gap="600">
          <div className="llm-premium-banner">
            <BlockStack gap="200">
              <Text variant="headingLg" as="h2">Optimization Center</Text>
              <Text variant="bodyLg" tone="subdued">
                Configure how your store products and pages are cataloged for AI retrieval. 
                Higher density metadata leads to better AI recommendations.
              </Text>
            </BlockStack>
          </div>

          <div className="llm-config-grid">
            {/* Left Column: Core Settings */}
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="400">
                  <div className="llm-section-header">
                    <Icon source={SearchIcon} tone="brand" />
                    <Text variant="headingMd" as="h3">Store Branding</Text>
                  </div>
                  
                  <TextField
                    label="Public Store Name"
                    value={formState.storeName}
                    onChange={(val) => setFormState({ ...formState, storeName: val })}
                    helpText="This is how AI bots will identify your brand."
                    autoComplete="off"
                  />
                  <TextField
                    label="Primary Domain Override"
                    value={formState.customDomain}
                    onChange={(val) => setFormState({ ...formState, customDomain: val })}
                    placeholder="e.g. www.yourshop.com"
                    helpText="Specify if you use a different domain for AI discovery."
                    autoComplete="off"
                  />
                  <TextField
                    label="Store Description for AI"
                    value={formState.description}
                    onChange={(val) => setFormState({ ...formState, description: val })}
                    helpText="Summarize your brand value. AI models use this as context."
                    multiline={4}
                    autoComplete="off"
                  />
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <div className="llm-section-header">
                    <Icon source={ProductIcon} tone="brand" />
                    <Text variant="headingMd" as="h3">Product Data Density</Text>
                  </div>
                  
                  <Text variant="bodyMd" tone="subdued">
                    Select exactly which product attributes should be included in the LLMs.txt file.
                  </Text>

                  <div className="llm-field-group">
                    <div className="llm-checkbox-grid">
                      {productFieldOptions.map((field) => (
                        <Checkbox
                          key={field.key}
                          label={field.label}
                          checked={formState.productFields[field.key]}
                          onChange={(val) => setFormState({
                            ...formState,
                            productFields: { ...formState.productFields, [field.key]: val }
                          })}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <Box padding="300" background="bg-surface-info-subdued" borderRadius="200">
                    <InlineStack gap="300">
                      <div className="llm-section-header">
                        <Text variant="bodySm">Title, URL, and Core Pricing are always included by default.</Text>
                        <Icon source={InfoIcon} tone="info" />
                      </div>
                    </InlineStack>
                  </Box>
                </BlockStack>
              </Card>
            </BlockStack>

            {/* Right Column: Visibility & Automation */}
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="400">
                  <div className="llm-section-header">
                    <Text variant="headingMd" as="h3">Inventory Scope</Text>
                    <Icon source={ViewIcon} tone="brand" />
                  </div>
                  <BlockStack gap="300">
                    <Checkbox
                      label="Include Products"
                      checked={formState.includeProducts}
                      onChange={(val) => setFormState({ ...formState, includeProducts: val })}
                    />
                    <Checkbox
                      label="Include Collections"
                      checked={formState.includeCollections}
                      onChange={(val) => setFormState({ ...formState, includeCollections: val })}
                    />
                    <Checkbox
                      label="Include Blogs"
                      checked={formState.includeBlogs}
                      onChange={(val) => setFormState({ ...formState, includeBlogs: val })}
                    />
                    <Checkbox
                      label="Include Pages"
                      checked={formState.includePages}
                      onChange={(val) => setFormState({ ...formState, includePages: val })}
                    />
                  </BlockStack>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="400">
                  <div className="llm-section-header">
                    <Text variant="headingMd" as="h3">Automation</Text>
                    <Icon source={SettingsIcon} tone="brand" />
                  </div>
                  <BlockStack gap="300">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text variant="bodyMd">Sync AI File</Text>
                      <Badge tone={formState.autoGenerate ? "success" : "warning"}>
                        {formState.autoGenerate ? "Auto" : "Manual"}
                      </Badge>
                    </div>
                    <Checkbox
                      label="Enable Auto-Sync"
                      checked={formState.autoGenerate}
                      onChange={(val) => setFormState({ ...formState, autoGenerate: val })}
                    />
                    <Text variant="bodySm" tone="subdued">
                      Automatically keep your LLMs.txt in sync.
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </div>
        </BlockStack>
      </Page>
    </div>
      {toastActive && (
        <Toast content="Settings saved successfully" onDismiss={toggleToastActive} />
      )}
    </Frame>
  );
}
