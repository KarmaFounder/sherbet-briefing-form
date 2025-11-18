import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ConvexProvider } from "convex/react";
import { convex } from "./convexClient";
import { Toaster } from "./components/ui/sonner";

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Root element #root not found");

createRoot(rootElement).render(
  <StrictMode>
    {convex ? (
      <ConvexProvider client={convex}>
        <App />
        <Toaster />
      </ConvexProvider>
    ) : (
      <>
        <div className="container-page">
          <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Convex is not configured. Set <code>VITE_CONVEX_URL</code> in your
            environment and redeploy.
          </div>
        </div>
        <Toaster />
      </>
    )}
  </StrictMode>,
);
