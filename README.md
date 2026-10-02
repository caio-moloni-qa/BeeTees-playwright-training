# BeeTee's

Training e-commerce SPA for Playwright automation. The app simulates a fast-food ordering flow with localized content, delivery lookup, guest checkout, DB-backed authentication, profile management, previous orders, and order confirmation.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 6, TypeScript, MUI |
| State | Zustand |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL 16 |
| DB client | `pg` |
| Tests | Playwright + Page Object Model |
| Geocoding | ViaCEP for BR, Nominatim for US/other |

Vite is still required: dev server, JSX/TS bundling, production build, and `/api` proxy.

## Quick Start

```bash
npm install
npx playwright install chromium
docker compose up -d db
npm run db:setup
npm run dev:all
```

| Service | URL |
|---|---|
| App | `http://localhost:5173` |
| API | `http://localhost:3001` |
| PostgreSQL | `localhost:5432` |

## Environment

Default local DB:

```txt
DATABASE_URL=postgres://beetee:beetee_dev_password@localhost:5432/beetee_dev
```

Optional env vars:

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | Express API port |
| `DATABASE_URL` | local Docker DB | PostgreSQL connection |
| `NOMINATIM_USER_AGENT` | training UA | OpenStreetMap request identity |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite frontend only |
| `npm run server` | Express API only |
| `npm run dev:all` | Frontend + API |
| `npm run db:migrate` | Apply `database/schema.sql` |
| `npm run db:seed` | Seed translations, products, promos, demo user, demo order |
| `npm run db:setup` | Migrate + seed |
| `npm run build` | TypeScript + Vite production build |
| `npm test` | Playwright headless run |
| `npm run test:ui` | Playwright UI mode |
| `npm run test:headed` | Headed Chromium |
| `npm run test:report` | Open HTML report |

## Database

PostgreSQL is authoritative for catalog, UI content, accounts, saved account locations, and authenticated order history.

Share DB structure through source-controlled files:

```txt
docker-compose.yml
database/schema.sql
database/migrate.mjs
database/seed.mjs
database/seeds/products.json
database/seeds/promos.json
database/seeds/translations.json
package.json
```

New machine setup:

```bash
npm install
docker compose up -d db
npm run db:setup
npm run dev:all
```

Tables:

| Table | Purpose |
|---|---|
| `translations` | UI copy by locale/key |
| `products` | Product metadata: category, image, price, calories, spicy flag |
| `product_translations` | Product name, short name, description by locale |
| `promos` | Promo carousel image metadata |
| `users` | Login identity and profile basics |
| `user_locations` | Saved account delivery location |
| `orders` | Authenticated checkout history |

Current seed source:

- `database/seeds/translations.json`
- `database/seeds/products.json`
- `database/seeds/promos.json`

Runtime content loads from PostgreSQL through `/api/content`. Product and translation changes should be made in seed data or the database, not in `src/`.

Auth seed data is created by `database/seed.mjs` directly from the same schema. User-created accounts are stored in the local database and are not portable unless exported with a database dump.

Seeded demo login:

```txt
Email: alex@beetees.test
Password: beetee123
```

## Data Ownership

Current split:

| Area | Source of truth | Runtime location | Notes |
|---|---|---|---|
| Products | PostgreSQL, seeded from `database/seeds/products.json` | `src/data/products.ts` | Client cache only |
| Promos | PostgreSQL, seeded from `database/seeds/promos.json` | `src/data/promos.ts` | Client cache only |
| UI translations | PostgreSQL, seeded from `database/seeds/translations.json` | `src/i18n/locale.ts` | `locale.ts` stores loaded dictionaries |
| User profiles | PostgreSQL `users` + `user_locations` | `src/stores/authStore.ts` | Authenticated session state |
| Previous orders | PostgreSQL `orders` | `src/stores/authStore.ts` | Loaded after login and checkout |
| Store service areas | `src/data/stores.ts` | `src/data/stores.ts` | Still frontend business rules |
| Postal/text helpers | `src/utils/text.ts` | `src/utils/text.ts` | Shared client utility logic |

`src/data/products.ts` and `src/data/promos.ts` are not static content sources anymore. They start empty, then `/api/content` fills them during app bootstrap.

Rule of thumb:

- Change product/menu/promo/translation content in DB seed files or directly in DB.
- Change delivery/store availability rules in `src/data/stores.ts`.
- Do not add product or translation literals back into `src/data/products.ts` or `src/i18n/locale.ts`.

## Content Flow

```txt
React startup
  -> useContentBootstrap()
  -> GET /api/content
  -> Express contentRepository
  -> PostgreSQL
  -> setProducts() + setPromos() + setTranslationDictionaries()
  -> localeVersion re-render
```

Locale behavior:

- Default: `en-US`
- Signup country selection updates the active locale immediately
- BR delivery/store lookup: switches to `pt-BR`
- US delivery/store lookup: switches to `en-US`
- Prices display USD or BRL via active locale

## Authentication Flow

Guest workflow remains unchanged: users can set delivery, customize items, use the cart, and check out without an account.

Authenticated workflow:

- Header profile icon opens login for guests and profile for authenticated users.
- Signup requires account details plus a deliverable location.
- Signup country controls initial language: BR uses Portuguese, US uses English.
- Login and signup show a smooth success overlay before navigation.
- Profile includes Account Details, Previous Orders, and Logout.
- Authenticated checkout saves the order to PostgreSQL.
- Users with previous orders see a localized reorder prompt on the home screen.

## API

Base URL: `http://localhost:3001`

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | API liveness |
| `GET` | `/api/content` | DB-backed products, translations, promos |
| `GET` | `/api/geocode?postalCode=&countryCode=` | Postal-code lookup |
| `GET` | `/api/delivery` | Read delivery session |
| `POST` | `/api/delivery` | Save delivery session |
| `GET` | `/api/auth/me` | Read authenticated user |
| `POST` | `/api/auth/login` | Start authenticated session |
| `POST` | `/api/auth/signup` | Create account with deliverable location and start authenticated session |
| `POST` | `/api/auth/logout` | Return to guest flow |
| `PUT` | `/api/auth/profile` | Update account details and location |
| `GET` | `/api/orders` | Read previous orders |
| `POST` | `/api/orders` | Save authenticated checkout order |

Sessions use `bt_sid` HttpOnly cookie + in-memory server `Map`.

## App Capabilities

- 16-product catalog across burgers, tenders, combos, drinks, sides
- Localized product names/descriptions and UI copy
- Promo carousel
- Menu category filter and search
- Product spicy badges and calories meter
- Guest checkout flow
- DB-backed login, mandatory-location signup, profile, logout, previous orders, localized reorder prompt, and success animations
- Delivery drawer with store availability
- Cart drawer with quantity controls and toast feedback
- Item customizer with add-ons
- Checkout with card validation, tip, donation, and promo code controls
- Confirmation page with ETA and delivery summary

## Architecture

```txt
src/App.tsx
|-- MenuPage
|   |-- PromoBanner
|   |-- CategoryFilter
|   |-- MenuSearch
|   `-- ProductCard
|-- CartDrawer
|-- LocationDrawer
|-- ItemCustomizerDialog
|-- CheckoutPage
|-- LoginPage
|-- SignupPage
|-- ProfilePage
`-- ConfirmationPage
```

State stores:

| Store | Role |
|---|---|
| `uiStore` | view, filter, search, toast, spinner, localeVersion |
| `cartStore` | cart lines, quantities, drawer state |
| `authStore` | authenticated user, previous orders, reorder prompt state |
| `locationStore` | delivery fields, lookup state, panel state |
| `checkoutStore` | form fields, errors, confirmation user |

## Testing

Tests live in `playwright/tests/`. Page Objects live in `playwright/pages/`.

Student challenge briefs live in `STUDENT_CHALLENGES.md`.

Run app first:

```bash
npm run dev:all
```

Run tests:

```bash
npm test
```

Specs:

| File | Covers |
|---|---|
| `product-catalog.spec.ts` | Product cards, images, prices, spicy badges |
| `category-filter.spec.ts` | Category filters and product counts |
| `location-panel.spec.ts` | Drawer behavior and field persistence |
| `geocoding-store.spec.ts` | ZIP lookup and store resolution |
| `cart.spec.ts` | Add-to-cart, quantities, subtotal, location gate |
| `checkout-validation.spec.ts` | Form validation and checkout rules |
| `order-confirmation.spec.ts` | Confirmation page content |
| `navigation.spec.ts` | Routing and navigation |
| `dynamic-translation.spec.ts` | EN/PT locale behavior |

Playwright config:

| Setting | Value |
|---|---|
| Base URL | `http://localhost:5173` |
| Browser | Chromium |
| Viewport | `1280x800` |
| Workers | `1` |
| Retries | `0` local, `2` CI |
| Trace | first retry |
| Screenshot | failure only |

## Test Data

| Key | ZIP | Country | Expected store |
|---|---|---|---|
| `londrina` | `86015280` | BR | `BeeTee's Higienopolis` |
| `saoPaulo` | `05413010` | BR | `BeeTee's Pinheiros` |
| `newYork` | `10001` | US | `BeeTee's Midtown` |
| `curitiba` | `80010010` | BR | no store |

Test card:

```txt
Name: Test User
Number: 4111111111111111
Expiry: 1228
CVC: 123
```

Promo codes (checkout, client-side validation, no API round-trip):

| Code | Type | Rule |
|---|---|---|
| `WELCOME10` | percent | 10% off the subtotal, no minimum |
| `SAVE5` | fixed | $5 off, $15 minimum order |
| `BEETEES2024` | percent | always expired — for negative testing |

## MCP

`mcps/mcp.json` configures the reusable MCP servers:

| Server | Purpose |
|---|---|
| `playwright` | Browser automation from agent chat |
| `playwright-test` | Run, debug, generate, heal specs |

The `mcps/rules/` folder contains the reusable agent rules that can be copied or linked into any IDE-specific agent setup.

## Troubleshooting

### `docker` not found

Install Docker Desktop, or run PostgreSQL manually and set `DATABASE_URL`.

### `/api/content` returns 503

DB is down, schema missing, or seed missing.

```bash
docker compose up -d db
npm run db:setup
```

### App stays on loading overlay

Check API and content endpoint:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/content
```

### Tests fail at startup

Ensure both app and DB are running:

```bash
docker compose up -d db
npm run db:setup
npm run dev:all
```
