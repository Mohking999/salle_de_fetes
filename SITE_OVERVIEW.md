# Salle des Fêtes — Site Overview

This document explains the current project structure, the main routes, how data flows through the app, and the core functions used by the site.

## Purpose

This project is a reservation management app for one or more event halls (`salles des fêtes`). It supports:

- public availability calendar + booking request form
- manager authentication and admin dashboard
- reservation editing, payment tracking, discount application, and ID card verification
- revenue reporting and exports to `.xlsx` / `.ics`

The stack is built with:

- React + TypeScript
- TanStack Start (server functions + React Start)
- TanStack Router + React Query
- Tailwind CSS
- jsPDF for receipt generation
- Excel/ICS export utilities

---

## Project entry points

### `src/routes/__root.tsx`

- Root route wrapper for the whole app.
- Sets global `<html>` / `<body>` markup.
- Provides `QueryClientProvider` and `DarkModeProvider`.
- Includes error and 404 page components.
- Loads global styles and fonts.

### `src/router.tsx`

- Creates the router using `routeTree.gen.ts`.
- Configures React Query client for the app.

### `src/routeTree.gen.ts`

- Auto-generated route tree by TanStack Router.
- Includes child routes and parent relationships.
- Do not edit by hand.

---

## Routes and pages

### `/`

File: `src/routes/index.tsx`

- Public homepage.
- Displays a month-based availability calendar.
- Uses `getPublicMonth` to load public booking cells.
- Allows selecting a date/slot and submitting a booking request.
- Supports event type selection (`henna`, `fatha_henna`, `fatha`, `event`).
- Automatically recommends a salle for Henna / Fatha+Henna.
- Shows a status legend and quick reservation counts.

### `/auth`

File: `src/routes/auth.tsx`

- Manager login and signup page.
- Offline authentication uses `localStorage`.
- Stores `users` and `auth_user` locally.
- Redirects logged-in users to `/dashboard`.

### `/_authenticated`

File: `src/routes/_authenticated/route.tsx`

- Protected wrapper route.
- `beforeLoad` checks `localStorage.auth_user`.
- Redirects unauthenticated visitors to `/auth`.
- Includes shared manager navigation and logout.

### `/_authenticated/dashboard`

File: `src/routes/_authenticated/dashboard.tsx`

- Manager dashboard page.
- Loads manager month data with `getManagerMonth`.
- Shows a reservation calendar, filters, and status indicators.
- Allows:
  - creating new salles
  - editing/reserving bookings
  - changing reservation status
  - deleting reservations
  - adding/removing versements (payments)
  - applying remises (discounts)
  - viewing and updating ID card status
  - exporting or generating receipts via helper utilities

### `/_authenticated/revenus`

File: `src/routes/_authenticated/revenus.tsx`

- Revenue reporting page.
- Loads yearly aggregated data via `getRevenue`.
- Displays monthly totals for:
  - reservations
  - gross revenue
  - discounts
  - payments received
  - remaining balance

### `/sitemap.xml`

File: `src/routes/sitemap[.]xml.ts`

- Generates a simple XML sitemap.
- Exposes `/` and `/auth`.
- Uses `BASE_URL` placeholder to generate absolute URLs.

---

## Core backend logic

### `src/lib/booking.functions.ts`

Defines all server functions used by the app:

- `getPublicMonth` (GET): returns public availability data for a month.
- `submitRequest` (POST): creates a new booking request and prevents duplicate reservations.
- `getManagerMonth` (GET): fetches manager/admin reservation data with related versements and remises.
- `createSalle` (POST): creates a new salle.
- `saveReservation` (POST): updates an existing reservation or creates a new one.
- `updateIdCardStatus` (POST): updates ID card status and number for a reservation.
- `setReservationStatus` (POST): updates a reservation's status.
- `deleteReservation` (POST): removes a reservation.
- `addVersement` / `deleteVersement` (POST): manage payments.
- `addRemise` (POST): add discounts, validating percentage rules.
- `getRevenue` (GET): aggregates reservation, versement, and remise totals by year.

Each function uses Zod validators from `src/lib/booking-schemas.ts` and `createServerFn` from TanStack React Start.

---

## Data and storage

### `src/lib/storage.ts`

Provides offline storage support in two modes:

- `ClientStorage` uses browser `localStorage`.
- `ServerStorage` uses an in-memory store for server-side usage.

`storage.ts` exports types and helper methods for:

- `Salles`
- `Reservations`
- `Versements`
- `Remises`

It also contains an initial demo dataset with:

- 2 salles
- 3 reservations
- 2 versements
- no remises by default

Storage methods include:

- `getSalles`, `getReservations`, `getVersements`, `getRemises`
- `addSalle`, `addReservation`, `updateReservation`, `deleteReservation`
- `addVersement`, `deleteVersement`
- `addRemise`

This means the current app can run in offline/demo mode without a real database.

---

## Validation schemas

### `src/lib/booking-schemas.ts`

- `monthSchema`: validates `YYYY-MM` month values.
- `requestSchema`: validates public reservation request payloads.
- `upsertSchema`: validates reservation create/update payloads.

These schemas ensure safe server function inputs for booking operations.

---

## Shared types and helpers

### `src/lib/booking-types.ts`

Defines reusable types and helper functions used across the app:

- `Slot`, `ReservationStatus`, `EventType`, `CookingLabId`, `IdCardStatus`
- `Salle`, `Versement`, `Remise`, `Reservation`, and `AvailabilityCell`
- UI label maps for slots, statuses, event types, cooking labs, and ID card statuses.
- `getRecommendedSalleId()`: chooses a recommended salle based on event type.
- `remiseAmount()` and `computeTotals()`: compute discounts, totals, payments, and remaining amount.
- `formatMoney()`: formats values as `fr-FR` currency strings with `DA`.
- `monthKey()` and `monthRange()`: convert month strings to date ranges.

These helpers are central to calendar, revenue, and export logic.

---

## Exports and receipts

### `src/lib/exports.ts`

- `exportMonthXlsx(month, reservations, salles)`: generates an Excel workbook with daily rows and both day/night slots.
- `exportMonthIcs(month, reservations, salles)`: generates an iCalendar file with one event per reservation.

If the app is used by admins, these exports allow offline reporting and calendar publishing.

### `src/lib/receipt.ts`

- `generateReceipt(reservation, versement, salleName)`: creates a PDF receipt using `jsPDF`.
- Includes event details, payment data, totals, discount, and remaining balance.

---

## UI components

The app uses shared UI primitives in `src/components/ui/` for consistent layout and controls, such as:

- `button`, `input`, `select`, `tabs`, `card`, `dialog`, `badge`, `table`, `textarea`, and more.

The booking calendar grid is rendered by:

- `src/components/booking/MonthGrid.tsx`

These components keep the UI consistent across public and authenticated pages.

---

## Authentication flow

The auth flow is currently offline/local:

- manager signup/login stores credentials in `localStorage.users`
- successful auth stores `localStorage.auth_user`
- protected routes use `beforeLoad()` to verify `auth_user`
- logout clears `auth_user` and redirects to `/auth`

This is a simple demo auth flow and does not use Supabase login in the current code.

---

## Running the project

The project uses `npm` scripts defined in `package.json`:

- `npm install`
- `npm run dev` => start the development server
- `npm run build` => build production assets via Vite
- `npm start` => start the built Node server from `.output/server/index.mjs`
- `npm run preview` => preview the built app

The app uses Vite and Nitro, and the build output is generated into `.output`.

---

## Notes

- Current server functions are backed by offline storage, not a real Supabase database.
- The `README.md` includes Supabase setup instructions, but the code in `src/lib/booking.functions.ts` currently uses `ServerStorage` for demo mode.
- There are deprecation warnings around `createServerFn().inputValidator()` in the current build output; future cleanup should replace them with `createServerFn().validator()`.
- The sitemap route is minimal and should set `BASE_URL` before production deployment.

---

## File map summary

- `README.md` — project introduction and setup instructions
- `SITE_OVERVIEW.md` — this file
- `src/routes/index.tsx` — public booking homepage
- `src/routes/auth.tsx` — manager login/signup
- `src/routes/_authenticated/route.tsx` — protected manager wrapper and nav
- `src/routes/_authenticated/dashboard.tsx` — manager dashboard
- `src/routes/_authenticated/revenus.tsx` — revenue reporting
- `src/routes/sitemap[.]xml.ts` — XML sitemap generator
- `src/routes/__root.tsx` — root app container, theme, error pages
- `src/router.tsx` — router creation
- `src/lib/booking.functions.ts` — server functions and booking API
- `src/lib/storage.ts` — offline/local storage data layer
- `src/lib/booking-types.ts` — shared types and business logic
- `src/lib/booking-schemas.ts` — Zod validation schemas
- `src/lib/exports.ts` — XLSX/ICS export helpers
- `src/lib/receipt.ts` — PDF receipt generation
- `src/components/booking/MonthGrid.tsx` — calendar grid UI
- `src/components/ui/*` — reusable UI primitives
