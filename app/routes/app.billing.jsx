
import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { MONTHLY_PLAN } from "../constants";

export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  const { shop } = session;
  const url = new URL(request.url);
  const plan = url.searchParams.get("plan");

  if (plan === "premium") {
    const billingRequest = await billing.request({
      plan: MONTHLY_PLAN,
      isTest: true, // Set to false for production
      returnUrl: `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}/app/plan`,
    });
    
    throw redirect(billingRequest.confirmationUrl);
  }

  return redirect("/app/plan");
};
