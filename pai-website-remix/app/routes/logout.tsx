import type { Route } from "./+types/logout";
import { logout } from "~/lib/session.server";

export async function action({ request }: Route.ActionArgs) {
  return logout(request);
}

export async function loader() {
  return { message: "Use POST to logout" };
}
