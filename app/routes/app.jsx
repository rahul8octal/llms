import { Link, Outlet, useLoaderData, useRouteError, useNavigation } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { SkeletonPage, SkeletonBodyText, SkeletonDisplayText, Box } from "@shopify/polaris";
import { useEffect, useRef } from "react";
import { authenticate } from "../shopify.server";
import { useI18n } from "../i18n";
import prisma from "../db.server";

// export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const host = url.searchParams.get("host");

  try {
    // Fetch session data with email and name
    const sessionData = await prisma.session.findFirst({
      where: { shop: session?.shop },
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return {
      apiKey: process.env.SHOPIFY_API_KEY || "",
      shop: session.shop,
      host,
      // Crisp data
      customerEmail: sessionData?.email || null,
      customerName: sessionData?.firstName
        ? `${sessionData.firstName}${sessionData.lastName ? ' ' + sessionData.lastName : ''}`
        : null,
    };
  } catch (error) {
    // Check if the error is a Response (redirect)
    if (error instanceof Response || error?.status === 302) {
      return error;
    }

    console.error("Loader error details:", error);

    return {
      apiKey: process.env.SHOPIFY_API_KEY || "",
      shop: session?.shop || "",
      host: url.searchParams.get("host"),
      error: "Failed to load app data",
    };
  }
};

export default function App() {
  const data = useLoaderData();
  const { t } = useI18n();
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";
  const welcomeMessageShown = useRef(false);

  // Crisp Chat integration - set all user data
  useEffect(() => {
    if (typeof window === "undefined" || !window.$crisp) return;

    const {
      shop,
      customerEmail,
      customerName,
    } = data;

    const storeUrl = shop ? `https://${shop}` : null;

    // Function to set Crisp data
    const setCrispData = () => {
      try {
        // MERCHANT IDENTITY (Always visible in Crisp dashboard)
        if (customerName) {
          window.$crisp.push(["set", "user:nickname", [customerName]]);
        } else if (shop) {
          window.$crisp.push(["set", "user:nickname", [shop]]);
        }

        if (customerEmail) {
          window.$crisp.push(["set", "user:email", [customerEmail]]);
        }

        if (storeUrl) {
          window.$crisp.push(["set", "user:website", storeUrl]);
        }

        // SESSION DATA (Custom data visible in Crisp visitor profile)
        if (shop) {
          window.$crisp.push(["set", "session:data", ["shop", shop]]);
        }
        if (storeUrl) {
          window.$crisp.push(["set", "session:data", ["store_url", storeUrl]]);
        }
        if (customerEmail) {
          window.$crisp.push(["set", "session:data", ["customer_email", customerEmail]]);
        }

        console.log("Crisp data set successfully");
      } catch (error) {
        console.error("Error setting Crisp data:", error);
      }
    };

    // Function to show welcome message
    const showWelcomeMessage = () => {
      if (welcomeMessageShown.current) return;

      try {
        const displayName = customerName || shop || "there";
        const welcomeMessage = `Hello ${displayName}! Welcome to Image Overlays! We're here to help you with any questions about adding overlays to your products. How can we assist you today?`;

        if (window.$crisp && Array.isArray(window.$crisp)) {
          window.$crisp.push(["do", "message:show", ["text", welcomeMessage]]);
          welcomeMessageShown.current = true;
        }
      } catch (error) {
        console.error("Error showing welcome message:", error);
      }
    };

    // Set data when session is loaded
    window.$crisp.push(["on", "session:loaded", function () {
      setCrispData();
      // Set data again after a short delay to ensure it's applied
      setTimeout(setCrispData, 1000);
    }]);

    // Show welcome message when chatbox opens
    window.$crisp.push(["on", "chat:opened", function () {
      setTimeout(showWelcomeMessage, 500);
    }]);

    // Try setting data immediately (in case session already loaded)
    setCrispData();
  }, [data]);

  return (
    <AppProvider isEmbeddedApp apiKey={data.apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Overview
        </Link>
        <Link to="/app/configuration">
          Configuration
        </Link>
        <Link to="/app/crawlers">
          Crawler Settings
        </Link>
        <Link to="/app/plan">
          Pricing
        </Link>
      </NavMenu>
      {isNavigating ? (
        <Box paddingBlock="400" paddingInline="400">
          <SkeletonPage backAction>
            <Box paddingBlockEnd="400">
              <SkeletonDisplayText size="small" />
            </Box>
            <SkeletonBodyText lines={3} />
            <Box paddingBlockStart="600">
              <SkeletonBodyText lines={5} />
            </Box>
          </SkeletonPage>
        </Box>
      ) : (
        <Outlet />
      )}
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
