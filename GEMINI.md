# DocSaathi - AI Assistant Context & Guidelines

This file contains essential project architecture, technical constraints, and strict guidelines for AI assistants working on this repository. **You MUST adhere to these rules to prevent breaking changes and ensure consistency.**

## 1. Tech Stack Overview
- **Framework:** Next.js 15+ (App Router strictly)
- **Styling:** Tailwind CSS v4 + Radix UI (shadcn/ui patterns)
- **Authentication:** Clerk v7 (`@clerk/nextjs` v7.4.1+)
- **Database:** Prisma ORM (PostgreSQL)
- **Integrations:** Vonage (Video calls), React Leaflet (Maps)
- **Theme:** `next-themes` (Dark/Light mode support)

## 2. Critical Constraints & Gotchas (Error Prevention)

### Clerk v7 specific rules (STRICT):
Clerk recently updated to v7. Many legacy patterns will crash the app:
- **NEVER use `<SignedIn>` or `<SignedOut>` components.** They are removed. You MUST use `<Show when="signed-in">` and `<Show when="signed-out">`.
- **Server APIs:** `auth()`, `currentUser()`, and `clerkClient` MUST be imported from `@clerk/nextjs/server`, not `@clerk/nextjs`.
- **Middleware:** `authMiddleware` is deprecated. Use `clerkMiddleware` as configured in `/middleware.js`.
- **Pricing Table:** Clerk's `<PricingTable>` component throws a fatal error in development if billing is not configured. **NEVER** use `<PricingTable>` directly. Always use `<ThemeAwarePricingTable>` from `components/clerk-elements.jsx`, which contains an Error Boundary and a visual mock fallback (`isBillingEnabled = false`) to prevent site crashes. Do not remove this mock unless explicitly asked by the user after they have configured Stripe/Billing.

### Next.js App Router Rules:
- **Server vs. Client Components:** Default to Server Components. Only add `"use client"` at the top of files that require React hooks (`useState`, `useEffect`), context, or browser-only APIs (like Leaflet or Vonage).
- **Data Fetching:** Use Server Actions (located in `/actions`) for database reads/writes instead of traditional API routes where possible.
- **Server Actions:** All files in `/actions` must start with `"use server"`. 

### Database & Prisma:
- **Prisma Client:** NEVER instantiate a new PrismaClient directly in files. Always import the singleton instance from `lib/prisma.js` to avoid connection exhaustion in Next.js dev mode.
- **Schema:** The schema is located at `prisma/schema.prisma`. Ensure any new models are migrated using `npx prisma migrate dev`.

### Styling & UI:
- Use Tailwind CSS for all styling. Avoid custom CSS files unless absolutely necessary (like standard `globals.css`).
- Use the `cn()` utility from `lib/utils.js` for merging Tailwind classes dynamically (e.g., `className={cn("base-class", conditionalClass)}`).
- Maintain the existing visual language: gradients, frosted glass effects (`backdrop-blur`), and rounded corners.

## 3. Directory Structure Guide
- `/app`: Next.js App Router pages, layouts, and API routes.
  - `/app/(auth)`: Clerk authentication pages (Sign-in/Sign-up).
  - `/app/(main)`: Main application routes grouped by feature (Admin, Doctor, Patients, Telemedicine).
- `/actions`: Server Actions for database interactions (e.g., `patient.js`, `doctor.js`).
- `/components`: Reusable UI components.
  - `/components/ui`: Base UI components (Buttons, Cards, Inputs - mostly Radix/shadcn).
- `/lib`: Utility functions, Prisma configuration, data constants, and schemas.
- `/hooks`: Custom React hooks (e.g., `use-fetch.js`).

## 4. Role-Based Architecture
The system relies on user roles defined in the database: `ADMIN`, `OWNER`, `DOCTOR`, `PATIENT`, and `UNASSIGNED`.
- Always verify the user's role via Server Actions (e.g., `getUserRole()`) before granting access to specific dashboards or actions.
- UI components (like `HeaderActions`) conditionally render links based on these roles. Ensure any new navigation respects this logic.

## 5. Standard Operating Procedure for Bug Fixes
1. **Verify Context:** Check `GEMINI.md` (this file) for known constraints.
2. **Isolate:** Is it a Client-side error (hooks, browser API) or Server-side (Prisma, Next.js routing)?
3. **Mock/Fallback:** If an external service (like Clerk Billing or Vonage Video) fails due to missing environment variables, implement a graceful fallback UI rather than letting the app crash.
4. **Validate:** Do not assume a fix works. Verify imports, check for App Router compatibility, and ensure responsive Tailwind styling remains intact.