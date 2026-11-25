"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const statusStyles = {
  Open: "bg-blue-100 text-blue-900",
  "In Review": "bg-amber-100 text-amber-900",
  Approved: "bg-emerald-100 text-emerald-900",
  Rejected: "bg-rose-100 text-rose-900",
  Completed: "bg-slate-200 text-slate-900",
};

const reasons = [
  "Damaged",
  "Wrong Item",
  "Size Issue",
  "Not As Described",
  "Changed Mind",
];

const pageSize = 5;
const inputStyle =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900";
const buttonStyle =
  "rounded-md border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-40";

export default function ReturnsDashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState({
    data: [],
    pagination: { total: 0, totalPages: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { data: returns, pagination } = result;
  const { total, totalPages } = pagination;

  function updateControl(setValue, value) {
    setLoading(true);
    setError("");
    setValue(value);
    setPage(1);
  }

  function changePage(nextPage) {
    setLoading(true);
    setError("");
    setPage(nextPage);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadReturns() {
      const params = new URLSearchParams({
        q: search.trim(),
        status,
        reason,
        sort,
        page: String(page),
        pageSize: String(pageSize),
      });

      try {
        const response = await fetch(`/api/returns?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error?.message || "Could not load returns.");
        }

        if (!Array.isArray(payload?.data) || !payload.pagination) {
          throw new Error("The returns API sent an unexpected response.");
        }

        if (!controller.signal.aborted) {
          setResult(payload);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(loadReturns, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, status, reason, sort, page]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-600">ReturnDesk</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Returns dashboard
            </h1>
          </div>
          <Link
            href="/returns/new"
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            New Return
          </Link>
        </header>

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <label className="lg:col-span-2">
            Search returns
            <input
              type="search"
              className={inputStyle}
              value={search}
              placeholder="Name, email, order or reference"
              onChange={(event) => updateControl(setSearch, event.target.value)}
            />
          </label>

          <label>
            Status
            <select
              className={inputStyle}
              value={status}
              onChange={(event) => updateControl(setStatus, event.target.value)}
            >
              <option value="">All statuses</option>
              {Object.keys(statusStyles).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Reason
            <select
              className={inputStyle}
              value={reason}
              onChange={(event) => updateControl(setReason, event.target.value)}
            >
              <option value="">All reasons</option>
              {reasons.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Sort by
            <select
              className={inputStyle}
              value={sort}
              onChange={(event) => updateControl(setSort, event.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>

        <p className="mb-3 mt-6 text-sm text-slate-600" role="status">
          {loading && "Loading returns…"}
          {!loading && !error && `${total} ${total === 1 ? "return" : "returns"} found`}
        </p>

        {error && <p role="alert" className="text-red-700">{error}</p>}

        {!loading && !error && returns.length === 0 && (
          <p className="rounded-lg border border-slate-200 bg-white p-5">
            No returns found on this page.
          </p>
        )}

        {!loading && !error && returns.length > 0 && (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {returns.map((item) => (
              <li
                key={item.id}
                className="grid min-w-0 gap-2 p-4 sm:grid-cols-4 sm:items-center"
              >
                <div className="min-w-0 break-words">
                  <Link
                    href={`/returns/${item.id}`}
                    className="font-semibold text-blue-800 hover:underline"
                  >
                    {item.reference}
                  </Link>
                  <p className="text-sm text-slate-600">{item.order_id}</p>
                </div>
                <p className="min-w-0 break-words text-sm font-medium">{item.customer_name}</p>
                <p className="text-sm text-slate-600">{item.reason}</p>
                <span
                  className={`justify-self-start rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.status]}`}
                >
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        )}

        {!loading && !error && (totalPages > 1 || page > 1) && (
          <nav
            aria-label="Returns pages"
            className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <span>Page {page} of {Math.max(1, totalPages)}</span>
            <div className="flex gap-2">
              <button
                type="button"
                className={buttonStyle}
                disabled={page === 1}
                onClick={() => changePage(page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className={buttonStyle}
                disabled={page >= totalPages}
                onClick={() => changePage(page + 1)}
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </div>
    </main>
  );
}