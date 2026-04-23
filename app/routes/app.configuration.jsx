
import { useState, useCallback } from "react";
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
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

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
    <Page 
        title="Configuration"
        backAction={{ content: "Overview", onAction: () => navigate("/app") }}
    >
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">Store Information</Text>
            <TextField
              label="Store Name"
              value={formState.storeName}
              onChange={(val) => setFormState({ ...formState, storeName: val })}
              helpText="The name that will appear in the llms.txt file"
              autoComplete="off"
            />
            <TextField
              label="Shopify Domain"
              value={settings.shopifyDomain}
              disabled
              helpText="Your Shopify store domain"
              autoComplete="off"
            />
            <TextField
              label="Custom Domain"
              value={formState.customDomain}
              onChange={(val) => setFormState({ ...formState, customDomain: val })}
              helpText="Your custom domain (e.g. www.mystore.com)"
              autoComplete="off"
            />
            <TextField
              label="Description"
              value={formState.description}
              onChange={(val) => setFormState({ ...formState, description: val })}
              helpText="Store description for AI assistants"
              multiline={4}
              autoComplete="off"
            />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">Content Settings</Text>
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
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">Product Information Fields</Text>
            <Text variant="bodyMd">Choose what details to share with AI assistants</Text>
            <Banner tone="info">
              <p>Basic fields (Title, URL, Price) are always included.</p>
            </Banner>
            <Grid>
              {productFieldOptions.map((field) => (
                <Grid.Cell key={field.key} columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4 }}>
                  <Checkbox
                    label={field.label}
                    checked={formState.productFields[field.key]}
                    onChange={(val) => setFormState({
                      ...formState,
                      productFields: { ...formState.productFields, [field.key]: val }
                    })}
                  />
                </Grid.Cell>
              ))}
            </Grid>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">Auto Generation</Text>
            <Checkbox
              label="Enable Auto Generation"
              checked={formState.autoGenerate}
              onChange={(val) => setFormState({ ...formState, autoGenerate: val })}
              helpText="Automatically keep llms.txt updated"
            />
          </BlockStack>
        </Card>

        <InlineStack align="end">
          <Button variant="primary" onClick={handleSave} loading={fetcher.state !== "idle"}>
            Save Settings
          </Button>
        </InlineStack>
      </BlockStack>
      <Box paddingBlockStart="500"></Box>
    </Page>
  );
}
