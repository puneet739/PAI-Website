import { defineConfig } from "@remix-run/dev";

export default defineConfig({
  ignoredRouteFiles: ["**/*.css.map"],
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true
  }
});
