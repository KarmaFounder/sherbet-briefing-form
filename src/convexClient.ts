import { ConvexReactClient } from "convex/react";

export const convexUrl = import.meta.env
  .VITE_CONVEX_URL as string | undefined;

if (!convexUrl) {
  // eslint-disable-next-line no-console
  console.warn(
    "VITE_CONVEX_URL is not set. Convex client will not be functional.",
  );
}

export const convex = convexUrl
  ? new ConvexReactClient(convexUrl)
  : null;
