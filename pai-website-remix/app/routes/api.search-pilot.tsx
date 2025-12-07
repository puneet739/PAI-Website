import type { Route } from "./+types/api.search-pilot";
import { query } from "~/lib/db.server";

interface PilotSearchResult {
  id: number;
  membership_id: string | null;
  name: string;
  profile_image: string | null;
  pilot_rating: string;
  membership_status: "active" | "inactive" | "pending";
  active_until: string | null;
  insurance_amount: number | null;
  insurance_policy_number: string | null;
  insurance_valid_until: string | null;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("q");

  if (!searchQuery || searchQuery.trim().length === 0) {
    return Response.json({ results: [] });
  }

  try {
    // Search by name or membership ID
    const results = await query<PilotSearchResult>(
      `SELECT 
        m.id,
        m.membership_id,
        m.name,
        m.profile_image,
        m.pilot_rating,
        m.membership_status,
        m.active_until,
        MAX(ip.coverage_amount) as insurance_amount,
        MAX(ip.policy_number) as insurance_policy_number,
        MAX(ip.end_date) as insurance_valid_until
      FROM members m
      LEFT JOIN insurance_policies ip ON m.id = ip.member_id AND ip.status = 'active'
      WHERE m.name LIKE ? OR m.membership_id LIKE ?
      GROUP BY m.id, m.membership_id, m.name, m.profile_image, m.pilot_rating, m.membership_status, m.active_until
      LIMIT 10`,
      [`%${searchQuery}%`, `%${searchQuery}%`]
    );

    return Response.json({ results });
  } catch (error) {
    console.error("Error searching pilots:", error);
    return Response.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
