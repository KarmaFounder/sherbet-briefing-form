import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ConvexProvider } from "convex/react";
import { convex } from "./convexClient";
import { Toaster } from "./components/ui/sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
      <Toaster />
    </ConvexProvider>
  </StrictMode>,
);
