# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Tooling & Common Commands

This is a React + TypeScript single-page app built with Vite, Tailwind CSS, Convex, and a Convex-based backend that integrates with Monday.com.

### Package scripts (run with `npm`)

- Install dependencies:
  - `npm install`
- Start frontend dev server (Vite):
  - `npm run dev`
- Type-check and build for production:
  - `npm run build`
- Run ESLint across the project:
  - `npm run lint`
- Preview the production build locally:
  - `npm run preview`

### Convex backend

All Convex functions live under `convex/` and expect the Convex CLI to be available.

Typical commands (from the repo root):

- Run Convex dev backend (for local development):
  - `npx convex dev`
- Deploy Convex functions to the configured Convex project:
  - `npx convex deploy`

> When working locally, you generally want **both** `npm run dev` and `npx convex dev` running so the React app can talk to the Convex backend.

### Tests

- There is **no test script configured** in `package.json` and no test framework wired up yet. If you add a test runner (e.g. Vitest or Jest), also update this section with how to run the full suite and a single test.

## High-Level Architecture

### Overview

The app is a campaign brief intake form for Sherbet Agency with:

- A **React/Tailwind frontend** that captures detailed briefing data and renders an admin dashboard.
- A **Convex backend** that stores briefs and exposes query/mutation functions.
- A **Monday.com integration** that posts summaries (and optionally a PDF) to Monday items derived from a job-bag email.
- A **PDF generator** that outputs a structured “Campaign Brief” PDF at submission time.

Data flows roughly as:

`CampaignBriefForm` → `generateBriefPDF` (client) → `convex.briefs.submitBrief` (mutation) → `briefs` table (Convex DB) → `mondayActions.postBriefToMonday` (Convex action) → Monday.com updates.

### Frontend structure (`src/`)

#### Entry and layout

- `src/main.tsx`
  - Mounts React into `#root`.
  - Instantiates a `ConvexReactClient` in `src/convexClient.ts` using `import.meta.env.VITE_CONVEX_URL`.
  - Wraps the app in `ConvexProvider` when `convex` is non-null; otherwise renders an inline configuration error and still mounts the global `Toaster`.

- `src/App.tsx`
  - Top-level page shell: logo, header, and main content container.
  - Manages two key bits of state:
    - `demoTrigger`: incremented by a **“Load Demo”** button; this is observed by `CampaignBriefForm` to prefill demo data.
    - `showAdmin`: toggled via an **“Admin”** button that prompts for a simple password; when true, shows `AdminDashboard` as a full-screen overlay.
  - Renders the main `CampaignBriefForm` and conditionally the `AdminDashboard` overlay.

#### Core form flow

- `src/components/CampaignBriefForm.tsx`
  - This is the primary form and the main place to modify business logic.
  - Uses:
    - `react-hook-form` + `zod` (`briefSchema`) for validation and typing.
    - `Form`, `FormField`, `FormItem`, etc. from `components/ui` as a form abstraction layer.
    - `FormOptions` from `src/lib/formOptions.ts` for option lists (strategy, TV, digital, social, etc.).
    - `generateBriefPDF` from `src/lib/pdfGenerator.ts` to create a PDF and get a base64 payload for backend storage.
    - `api.briefs.submitBrief` via `useMutation` from Convex to persist briefs.
  - The `briefSchema` mirrors (and should stay in sync with) the Convex `briefs` table fields, including:
    - Overview fields (user/client/brand/campaign/budget/priority).
    - Category flags and category-specific details (TV, Radio, Print, Digital, Brand Video, Photography, PR, Influencer, Activation, Application Build, Website, Other).
    - Social media items as a dynamic list: each row has platform → format → size cascades and quantity + descriptions.
    - Timeline fields (kickstart, first review, sign-off) with date ordering enforced via custom `superRefine` logic.
    - Billing type (`Retainer` vs `OutOfScope`) and asset references.
  - On submit:
    1. Looks up internal user metadata (email/phone) from `INTERNAL_USERS`.
    2. Calls `generateBriefPDF` to generate and save a PDF on the client, collecting a base64 string.
    3. Normalizes the `budget` string into a numeric value (strips non-digits) and passes `undefined` if empty/invalid.
    4. Calls the `briefs.submitBrief` mutation with the entire payload plus `pdf_base64`.
    5. Shows success/failure toasts, resets the form to `DEFAULT_VALUES`, and clears dynamic social rows.
  - The **“Load Demo”** button in `App` increments `demoTrigger`, which `CampaignBriefForm` observes with an effect to call `fillDemoData()` (setting many fields and seeding example social media rows + descriptions).

- `src/components/AdminDashboard.tsx`
  - Full-screen modal overlay providing a simple analytics dashboard.
  - Uses Convex `useQuery` hooks for:
    - `api.admin.getUserStats` — briefs per user.
    - `api.admin.getBriefMetrics` — total counts, retainer vs out-of-scope, budgets, category and priority distribution.
    - `api.admin.getAllBriefs` — raw list of all briefs.
  - Renders:
    - Metric cards (total briefs, retainer/out-of-scope counts, average budget).
    - Scrollable lists of briefs by user and category popularity.
    - Priority distribution tiles.
    - A tabular view of all briefs (campaign/client/submitter/priority/billing/categories/budget).

#### Shared UI & utilities

- `src/components/ui/*`
  - Design system layer for form controls (button, input, textarea, select, checkbox, calendar, popover, alert, toast), largely wrapping Radix UI primitives and `sonner`.
  - When adding new form components, prefer to build on these abstractions for consistency.

- `src/lib/formOptions.ts`
  - Central repository of all options and size metadata used in the form:
    - Category options (strategy, brand development, TV, radio, billboards, print, brand video, photography, PR, influencer, activation, digital, app build, website, other).
    - Social media hierarchy: `SOCIAL_MEDIA_PLATFORMS` → `SOCIAL_MEDIA_FORMATS` → `SOCIAL_MEDIA_SIZES` (used to drive dependent dropdowns and size previews in `CampaignBriefForm`).
  - Any change to the available choices should typically be made here and will be reflected where referenced in the form.

- `src/lib/pdfGenerator.ts`
  - Encapsulates PDF layout for a single brief using `jspdf`.
  - Responsibilities:
    - Draws a logo, title, and section headings.
    - Renders campaign overview, categories, and per-category details, using helper functions for fields and lists.
    - For social media items, parses dimension strings and draws scaled rectangles with aspect ratio annotations.
    - Adds “Additional Information” (assets, other requirements, references) and timeline (kickstart, review, sign-off).
    - Writes a footer with a generated-on timestamp.
    - Saves the PDF to the client’s machine and returns a base64 string (without the data URI prefix) for backend upload.
  - If you add fields to the brief model, update this file so the PDF stays in sync with what is collected and stored.

- `src/lib/utils.ts`
  - Provides `cn` (class name merge) built on `clsx` and `tailwind-merge`. Use this when composing Tailwind class strings.

### Backend & Convex functions (`convex/`)

#### Data model

- `convex/schema.ts`
  - Defines a single `briefs` table capturing the complete campaign brief structure:
    - User metadata (name/email/phone).
    - Client/brand/campaign and campaign summary.
    - Requested-by contact and job_bag_email (used to derive a Monday item ID).
    - Dates (start/end, kickstart, first review, sign-off).
    - Priority, optional numeric budget, and billing type.
    - Category arrays and all category-specific option/detail fields.
    - Optional `social_media_items` array (platform/format/size/quantity/descriptions).
    - Asset presence and link, other requirements, and references.
    - `pdf_base64` is declared in the schema but the current mutation omits it when inserting, so it is not actually persisted.
  - The **Zod schema in `CampaignBriefForm` and the Convex validators here should remain aligned** when adding or changing fields.

#### Brief submission and Monday integration

- `convex/briefs.ts`
  - Exposes `submitBrief` as a Convex mutation.
  - Accepts a full brief payload plus an optional `pdf_base64` string.
  - In the handler:
    - Destructures `pdf_base64` off the args and stores the remaining `briefData` in the `briefs` table.
    - Immediately schedules an asynchronous action via `ctx.scheduler.runAfter(0, internal.mondayActions.postBriefToMonday, { briefData, pdfBase64 })`.
  - The mutation returns the inserted document ID and does **not** wait for Monday integration to complete.

- `convex/mondayHelpers.ts`
  - Utilities shared by Monday-related logic:
    - `extractJobIdFromEmail(email)` — parses a job ID from `job-<id>@...` or `pulse_<id>_...` email patterns.
    - `MONDAY_USER_IDS` — mapping of key stakeholder user IDs used in @mentions for out-of-scope briefs.
    - `createMondayUpdate`, `attachFileToUpdate`, `createOutOfScopeNotification` — thin wrappers around Monday GraphQL API for creating updates and optionally attaching a PDF.
    - `buildBriefSummary(briefData, pdfUrl?)` — constructs a concise multi-line summary of the brief suitable for posting as a Monday update (optionally including a URL to the PDF).

- `convex/mondayActions.ts`
  - Convex `action` responsible for actually calling Monday.
  - Reads `MONDAY_API_TOKEN` from `process.env` inside the Convex runtime.
  - Steps:
    1. Validates that the API key and `briefData.job_bag_email` are present.
    2. Uses `extractJobIdFromEmail` to derive the Monday item ID; if this fails, logs and returns a failure payload.
    3. If a `pdfBase64` string is provided, calls `storePdfAndGetUrl` to convert it into a blob, store it with Convex storage, and retrieve a public URL.
    4. Builds a brief summary via `buildBriefSummary(briefData, null)` and posts it as a Monday update (`createMondayUpdate`).
    5. If `billing_type === "OutOfScope"`, posts a second update via `createOutOfScopeNotification`, mentioning key users with their Monday IDs.
  - Any changes to how Monday is used (different boards, additional metadata, attaching the stored PDF URL, etc.) should go through this action and the helper utilities.

#### Admin queries

- `convex/admin.ts`
  - `getAllBriefs`: returns all documents from the `briefs` table.
  - `getUserStats`: aggregates counts of briefs per `user_name`, sorted descending, for use in the Admin dashboard.
  - `getBriefMetrics`: computes high-level metrics used by the dashboard:
    - Total briefs and counts split by `billing_type` (Retainer vs OutOfScope).
    - Category counts (how many briefs include each category).
    - Priority distribution counts.
    - Total and average budget across briefs with a non-zero budget.

### Generated Convex client code

- `convex/_generated/*`
  - Type-safe Convex client bindings used by the frontend (e.g. `api.briefs.submitBrief`, `api.admin.getUserStats`).
  - These files are **generated** and should not be edited directly; run Convex tooling (`npx convex dev` or `npx convex codegen`) if they need regeneration.

## Environment & Configuration

- Frontend expects `VITE_CONVEX_URL` to be defined in the environment (e.g. in a `.env` file or deployment config), pointing at the appropriate Convex deployment.
- Convex actions expect a `MONDAY_API_TOKEN` environment variable available in the Convex runtime for calling the Monday API.
- When running locally, ensure your Convex project is linked/configured and that any required env vars are set via the Convex CLI or dashboard.

## When Modifying or Extending Functionality

- Keep the following in sync when introducing new fields or changing structure:
  - `briefSchema` and `DEFAULT_VALUES` in `src/components/CampaignBriefForm.tsx`.
  - The Convex `briefs` table definition in `convex/schema.ts`.
  - The argument validators and payload in `convex/briefs.ts`.
  - PDF rendering in `src/lib/pdfGenerator.ts`.
  - Any relevant admin metrics in `convex/admin.ts`.
- For changes that affect Monday updates (e.g. different summary format, more metadata, or PDF links), update both `convex/mondayHelpers.ts` and `convex/mondayActions.ts` so the flow remains coherent.
