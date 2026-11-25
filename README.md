# ReturnDesk

ReturnDesk is a returns desk for a small online store. A support agent logs a customer’s return, reviews the request, records the resolution, and closes it. The dashboard lets agents search by customer name or email, order ID, or return reference and combine that search with status and reason filters.

**Live app:** [return-desk-omega.vercel.app](https://return-desk-omega.vercel.app)  
**API health:** [return-desk-s018.onrender.com/api/health](https://return-desk-s018.onrender.com/api/health)  
**Time spent:** Approximately 8–9 hours.

The frontend uses Next.js App Router, React, Tailwind CSS, and JavaScript. The API uses Express 5 and `pg`. Supabase hosts PostgreSQL, Render hosts Express, and Vercel hosts Next.js.

## Run locally

You need Git, Node.js 22.13+ on the 22.x line or a newer supported LTS release, npm, and a Supabase project with an empty PostgreSQL database. Use two terminals.

1. Clone the repository.

   ```sh
   git clone https://github.com/Raghavuchiha/return-desk.git
   cd return-desk
   ```

2. In the Supabase SQL Editor, run [db/schema.sql](db/schema.sql) once, then run [db/seed.sql](db/seed.sql) once. On an empty database, this creates **30 returns across all five statuses and all five reasons**, plus **10 notes**. The seed is intended for one run on a fresh database.
3. Create `backend/.env` using [backend/.env.example](backend/.env.example). In Supabase, copy the PostgreSQL URI under **Connect → Transaction pooler**. Replace the password placeholder with your database password, URL-encoding special characters in the password. Set the completed URI as `DATABASE_URL`.
4. From the repository root, start Express.

   ```sh
   cd backend
   npm ci
   npm start
   ```

   Open [localhost:4000/api/health](http://localhost:4000/api/health). A fresh seed should return `{"status":"ok","visibleReturns":30}`.

5. In a second terminal at the repository root, start Next.js.

   ```sh
   cd frontend
   npm ci
   npm run dev
   ```

   Open [localhost:3000](http://localhost:3000). If Express runs at a different URL, set `BACKEND_URL` in `frontend/.env.local` and restart Next.js.

### Environment variables

| Variable | Where to set it | Purpose |
|---|---|---|
| `DATABASE_URL` | `backend/.env` locally or Render | PostgreSQL connection URI. Required. |
| `PORT` | `backend/.env` locally | Express port. Defaults to `4000`. Render supplies its own port. |
| `BACKEND_URL` | `frontend/.env.local` locally or Vercel | Express base URL, including the scheme and with no trailing slash. Defaults to `http://localhost:4000` locally. |

For deployment, use `backend/` as the Render root, with `npm ci` and `npm start`. Use `frontend/` as the Vercel root and configure `BACKEND_URL` before building. Keep the database connection string on the backend.

## Workflow and business rules

| Current status | Allowed next status | Edit details | Remove |
|---|---|---|---|
| Open | In Review | Yes | Yes |
| In Review | Approved or Rejected | Yes | |
| Approved | Completed | | |
| Rejected | Final | | Yes |
| Completed | Final | | |

Approval requires **Refund**, **Replacement**, or **Store Credit**. Refund requires a positive amount with up to two decimal places. Replacement and Store Credit have an empty refund amount. Completion retains the chosen resolution. Notes are append-only and available for visible requests at any status.

## API

The local base URL is `http://localhost:4000`. The Next.js app forwards `/api/returns` and its subpaths to Express using a rewrite.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Confirm Express can query the database |
| GET | `/api/returns` | List visible requests and pagination totals |
| POST | `/api/returns` | Create an Open request with a generated reference |
| GET | `/api/returns/:id` | Fetch a request and its chronological notes |
| PATCH | `/api/returns/:id` | Update eligible request details |
| POST | `/api/returns/:id/transitions` | Change status and supply a resolution on approval |
| POST | `/api/returns/:id/notes` | Append a note using `{"body":"…"}` |
| DELETE | `/api/returns/:id` | Soft-remove an eligible request and return `204` |

The list accepts `q`, `status`, `reason`, `sort` (`newest` or `oldest`), `page`, and `pageSize`. For example:

```text
GET /api/returns?q=customer&status=Open&reason=Damaged&sort=oldest&page=1&pageSize=5
```

Validation errors use `400`, missing or removed returns use `404`, and duplicate live requests or state conflicts use `409`. Error bodies have the shape `{"error":{"code":"…","message":"…"}}`.

## Design decisions and assumptions

- **Two tables.** `return_requests` stores the request and its current state. `request_notes` uses a foreign key to store many notes per request. Notes are ordered by timestamp, then ID to break ties.
- **Database-generated reference.** An insert trigger creates a unique reference such as `RET-31` from the row ID. A partial unique index blocks simultaneous live requests for the same order and item, including conflicts caused by edits.
- **State changes are transactional.** The API locks the request row before checking rules for edits, transitions, notes, and removal. Competing writes on the same return wait for the current transaction to finish.
- **Server-side dashboard queries.** PostgreSQL applies the filters, sorting, and pagination. One statement returns the current page and matching count. The dashboard waits 300 ms after input changes and cancels superseded requests.
- **Soft removal and duplicate handling.** Removal sets `removed_at` and hides the row from both list and detail endpoints. A removed Open request keeps its duplicate slot because the brief says the prior request must reach Rejected or Completed before a new one is allowed.
- **Support-agent entry.** Agents record customer contact by email and enter the order and item IDs manually. Recording a resolution tracks the support decision. Fulfillment and payment processing happen outside ReturnDesk.

## Scope and verification

The three screens and seven return operations are implemented. Verification was manual through the UI and direct API calls. There is no automated test suite. The live deployment is a public demo using sample data and has no sign-in. Use fictitious customer details when trying it.

To smoke-test the workflow, create a return with a fresh order and item ID, verify a duplicate is refused, then edit its quantity, start review, approve with a refund, and complete it. Add a note and reload to confirm persistence. Use a second request to test rejection and soft removal.
