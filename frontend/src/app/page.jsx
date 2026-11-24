"use client";

import Link from "next/link";
import { useState } from "react";
import { sampleReturns } from "../lib/sampleReturns";

const statusStyles = {
  Open: "bg-blue-100 text-blue-900",
  "In Review": "bg-amber-100 text-amber-900",
  Approved: "bg-emerald-100 text-emerald-900",
  Rejected: "bg-rose-100 text-rose-900",
  Completed: "bg-slate-200 text-slate-900",
};

const reasons = ["Damaged", "Wrong Item", "Size Issue", "Not As Described", "Changed Mind"];



const pageSize = 5;
const inputStyle = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900";
const buttonStyle = "rounded-md border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-40";

export default function ReturnsDashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  function updateControl(setValue, value) {
    setValue(value);
    setPage(1);
  }

  const query = search.trim().toLowerCase();
  const matches = sampleReturns.filter((item) => {
    const searchable = [item.reference, item.customer, item.email, item.order];
    return (!status || item.status === status)
      && (!reason || item.reason === reason)
      && searchable.some((value) => value.toLowerCase().includes(query));
  });

  // The demo IDs increase in creation order.
  matches.sort((first, second) => sort === "newest" ? second.id - first.id : first.id - second.id);
  const totalPages = Math.ceil(matches.length / pageSize);
  const start = (page - 1) * pageSize;
  const visibleReturns = matches.slice(start, start + pageSize);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-600">ReturnDesk</p>
            <h1 className="text-3xl font-semibold tracking-tight">Returns dashboard</h1>
          </div>
          <Link href="/returns/new" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            New Return
          </Link>
        </header>

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <label className="lg:col-span-2">
            Search returns
            <input type="search" className={inputStyle} value={search} placeholder="Name, order or reference" onChange={(event) => updateControl(setSearch, event.target.value)} />
          </label>
          <label>
            Status
            <select className={inputStyle} value={status} onChange={(event) => updateControl(setStatus, event.target.value)}>
              <option value="">All statuses</option>
              {Object.keys(statusStyles).map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Reason
            <select className={inputStyle} value={reason} onChange={(event) => updateControl(setReason, event.target.value)}>
              <option value="">All reasons</option>
              {reasons.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Sort by
            <select className={inputStyle} value={sort} onChange={(event) => updateControl(setSort, event.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>

        <p className="mb-3 mt-6 text-sm text-slate-600" role="status">
          {matches.length} {matches.length === 1 ? "return" : "returns"} found
        </p>
        {visibleReturns.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-5">No returns match your search or filters.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {visibleReturns.map((item) => (
              <li key={item.id} className="grid min-w-0 gap-2 p-4 sm:grid-cols-4 sm:items-center">
                <div>
                  <Link href={"/returns/" + item.id} className="font-semibold text-blue-800 hover:underline">
                    {item.reference}
                  </Link>
                  <p className="text-sm text-slate-600">{item.order}</p>
                </div>
                <p className="break-words text-sm font-medium">{item.customer}</p>
                <p className="text-sm text-slate-600">{item.reason}</p>
                <span className={"justify-self-start rounded-full px-2.5 py-1 text-xs font-semibold " + statusStyles[item.status]}>
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <nav aria-label="Returns pages" className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" className={buttonStyle} disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
              <button type="button" className={buttonStyle} disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </nav>
        )}
      </div>
    </main>
  );
}
