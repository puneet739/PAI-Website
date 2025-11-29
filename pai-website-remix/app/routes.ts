import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("verify-otp", "routes/verify-otp.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("insurance", "routes/insurance.tsx"),
  route("tests", "routes/tests.tsx"),
  route("tests/:level", "routes/tests.$level.tsx"),
  route("tests/results", "routes/tests.results.tsx"),
  route("logout", "routes/logout.tsx"),
] satisfies RouteConfig;
