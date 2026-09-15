import type { Route } from "./+types/api.check-care-portal";
import { checkCarePortalAndRecord } from "~/lib/insurance-booking.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  try {
    await checkCarePortalAndRecord();
  } catch (err) {
    console.error("CARE portal check failed:", err);
  }

  return new Response(null, { status: 204 });
}
