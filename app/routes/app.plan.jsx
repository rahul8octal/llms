
import { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Badge,
  Icon,
  Grid,
} from "@shopify/polaris";
import { CheckIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing } = await authenticate.admin(request);
  
  // Check current subscription
  const billingCheck = await billing.check();
  const currentPlan = billingCheck.appSubscriptions[0]?.name || "Free";

  return json({
    currentPlan,
  });
};

export default function PlanPage() {
  const { currentPlan } = useLoaderData();
  const fetcher = useFetcher();

  const plans = [
    {
      name: "Premium",
      price: "$9.99",
      interval: "/month",
      description: "Unlimited products - Monthly subscription",
      badge: "BEST VALUE",
      primary: true,
      features: [
        "Unlimited products & variants",
        "Advanced LLMs.txt generation",
        "All AI crawler optimization",
        "Automatic daily updates",
        "Priority analytics dashboard",
        "Monthly billing - Cancel anytime",
        "Premium access & updates",
        "Premium support",
      ],
      buttonText: currentPlan === "Premium" ? "Current Plan" : "Subscribe Now",
      buttonDisabled: currentPlan === "Premium",
      action: "/app/billing?plan=premium",
    },
    {
      name: "Free",
      price: "$0",
      interval: "/month",
      description: "Perfect for getting started",
      badge: "CURRENT PLAN",
      primary: false,
      features: [
        "Up to 500 products",
        "Basic LLMs.txt generation",
        "Standard AI crawler optimization",
        "Manual updates only",
        "Basic analytics",
        "Community support",
        "Standard response time",
      ],
      buttonText: "Active Plan",
      buttonDisabled: true,
      action: "#",
    },
  ];

  return (
    <Page title="Choose Your Plan" subtitle="Get discovered by AI assistants like ChatGPT, Claude, and Gemini">
      <Box paddingBlockStart="800" paddingBlockEnd="800">
        <BlockStack gap="800" align="center">
          <Box width="100%">
            <Grid>
              {plans.map((plan) => (
                <Grid.Cell key={plan.name} columnSpan={{ xs: 6, sm: 6, md: 3, lg: 6 }}>
                  <Card padding="0">
                    <div style={{
                      position: 'relative',
                      border: plan.primary ? '2px solid #008060' : '1px solid #e1e3e5',
                      borderRadius: '12px',
                      flex: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: 'var(--p-color-bg-surface)',
                      minHeight: '520px'
                    }}>
                      {plan.badge && (
                        <div style={{
                          position: 'absolute',
                          top: '-12px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 10
                        }}>
                          <Badge tone={plan.primary ? "success" : "subdued"}>
                            {plan.badge}
                          </Badge>
                        </div>
                      )}

                      <Box padding="600">
                        <BlockStack gap="400" align="start">
                          <BlockStack gap="100" align="start">
                            <Text variant="headingLg" as="h2">{plan.name}</Text>
                            <Text variant="bodyMd" tone="subdued">{plan.description}</Text>
                          </BlockStack>

                          <InlineStack blockAlign="baseline" gap="100">
                            <Text variant="heading2xl" as="p">{plan.price}</Text>
                            <Text variant="bodyMd" tone="subdued">{plan.interval}</Text>
                          </InlineStack>

                          {plan.name === "Premium" && (
                            <Text variant="bodySm" tone="success" fontWeight="bold">
                              Cancel anytime - No commitment
                            </Text>
                          )}

                          <Box paddingBlockStart="200" paddingBlockEnd="400">
                            <Button 
                              variant={plan.primary ? "primary" : "secondary"} 
                              fullWidth 
                              size="large"
                              disabled={plan.buttonDisabled}
                              url={plan.action}
                            >
                              {plan.buttonText}
                            </Button>
                          </Box>

                          <BlockStack gap="300" align="start">
                            {plan.features.map((feature) => (
                              <InlineStack key={feature} gap="200" align="start" blockAlign="center">
                                <Box width="20px">
                                  <Icon source={CheckIcon} tone="success" />
                                </Box>
                                <Text variant="bodyMd">{feature}</Text>
                              </InlineStack>
                            ))}
                          </BlockStack>
                        </BlockStack>
                      </Box>
                    </div>
                  </Card>
                </Grid.Cell>
              ))}
            </Grid>
          </Box>
          
          <InlineStack align="center" gap="400">
            <InlineStack gap="100" blockAlign="center">
              <Text variant="bodySm" tone="subdued">🔒 Secure payment via Shopify</Text>
            </InlineStack>
            <Text variant="bodySm" tone="subdued">• Cancel anytime • No long-term commitment</Text>
          </InlineStack>
        </BlockStack>
      </Box>
    </Page>
  );
}
