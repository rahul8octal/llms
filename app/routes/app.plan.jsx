
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
    <Page title="Plans">
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 0" }}>
        <BlockStack gap="800">
          <div style={{ textAlign: 'center' }}>
            <BlockStack gap="200">
              <Text variant="heading2xl" as="h1">Unlock your AI potential</Text>
              <Text variant="bodyLg" tone="subdued">Choose the plan that's right for your store's growth.</Text>
            </BlockStack>
          </div>

          <Grid>
            {plans.map((plan) => (
              <Grid.Cell key={plan.name} columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6 }}>
                <div style={{
                  background: 'white',
                  borderRadius: '24px',
                  padding: '40px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: plan.primary ? '2px solid var(--llm-primary)' : '1px solid #e2e8f0',
                  boxShadow: plan.primary ? 'var(--llm-shadow-lg)' : 'var(--llm-shadow-sm)',
                  position: 'relative',
                  transition: 'transform 0.3s ease',
                }}>
                  {plan.primary && (
                    <div style={{
                      position: 'absolute',
                      top: '-16px',
                      right: '32px',
                    }}>
                      <Badge tone="success" size="large">POPULAR</Badge>
                    </div>
                  )}

                  <BlockStack gap="600">
                    <BlockStack gap="200">
                      <Text variant="headingLg" as="h2">{plan.name}</Text>
                      <Text variant="bodyMd" tone="subdued">{plan.description}</Text>
                    </BlockStack>

                    <InlineStack blockAlign="baseline" gap="100">
                      <Text variant="heading3xl" as="p">{plan.price}</Text>
                      <Text variant="bodyLg" tone="subdued">{plan.interval}</Text>
                    </InlineStack>

                    <Button 
                      variant={plan.primary ? "primary" : "secondary"} 
                      fullWidth 
                      size="large"
                      disabled={plan.buttonDisabled}
                      url={plan.action}
                    >
                      {plan.buttonText}
                    </Button>

                    <BlockStack gap="400">
                      <Text variant="headingSm" as="h3">Features included:</Text>
                      <BlockStack gap="300">
                        {plan.features.map((feature) => (
                          <InlineStack key={feature} gap="300" blockAlign="center">
                            <div style={{ color: '#22c55e' }}>
                              <Icon source={CheckIcon} tone="inherit" />
                            </div>
                            <Text variant="bodyMd">{feature}</Text>
                          </InlineStack>
                        ))}
                      </BlockStack>
                    </BlockStack>
                  </BlockStack>
                </div>
              </Grid.Cell>
            ))}
          </Grid>

          <div style={{ textAlign: 'center', opacity: 0.6 }}>
            <Text variant="bodySm" tone="subdued">🔒 Secure payment via Shopify • Cancel anytime • No commitment</Text>
          </div>
        </BlockStack>
      </div>
    </Page>
  );
}
