"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReturnForm from "../../../components/ReturnForm";

const panel = "rounded-lg border border-slate-200 bg-white p-4";
const button = "rounded-md border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-50";
const input = "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2";

async function requestReturn(url, options) {
  const response = await fetch(url, { cache: "no-store", ...options });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Could not process the return request.");
  }

  if (!payload?.data) {
    throw new Error("The returns API sent an unexpected response.");
  }

  return payload.data;
}

function ReturnDetails({ id }) {
  const router = useRouter();
  const endpoint = `/api/returns/${encodeURIComponent(id)}`;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [resolution, setResolution] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    requestReturn(endpoint, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setItem(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [endpoint]);

  async function save(method, path = "", values) {
    if (saving) return false;

    setSaving(true);
    setError("");

    try {
      const options = { method };

      if (values !== undefined) {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(values);
      }

      const data = await requestReturn(endpoint + path, options);

      if (method === "DELETE") {
        router.replace("/");
      } else if (path === "/notes") {
        setItem((current) => ({
          ...current,
          notes: [...current.notes, data].sort(
            (first, second) =>
              Date.parse(first.created_at) - Date.parse(second.created_at) ||
              first.id - second.id,
          ),
        }));
      } else {
        setItem((current) => ({ ...current, ...data }));
      }

      return true;
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  function changeStatus(status) {
    return save("POST", "/transitions", { status });
  }

  function approve(event) {
    event.preventDefault();

    const values = { status: "Approved", resolution };
    if (resolution === "Refund") values.refundAmount = refundAmount;

    return save("POST", "/transitions", values);
  }

  async function addNote(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const body = new FormData(form).get("body").trim();

    if (!body) {
      setError("Enter a note before saving.");
      return;
    }

    if (await save("POST", "/notes", { body })) form.reset();
  }

  if (loading) return <p role="status">Loading return…</p>;
  if (!item) return <p role="alert" className="text-red-700">{error}</p>;

  const { status } = item;
  const canEdit = status === "Open" || status === "In Review";
  const canRemove = status === "Open" || status === "Rejected";

  const fields = [
    ["Customer", item.customer_name],
    ["Email", item.customer_email],
    ["Order ID", item.order_id],
    ["Item ID", item.item_id],
    ["Quantity", item.quantity],
    ["Reason", item.reason],
  ];

  if (item.resolution) fields.push(["Resolution", item.resolution]);
  if (item.refund_amount != null) fields.push(["Refund amount", item.refund_amount]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">{item.reference}</h1>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {saving && <p role="status">Saving…</p>}

      <section className={panel}>
        <p className="mb-3 font-semibold">{status}</p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="min-w-0 break-words">
              <dt className="text-slate-600">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        {!editing && (
          <div className="mt-4 flex flex-wrap gap-2">
            {canEdit && (
              <button className={button} disabled={saving} onClick={() => setEditing(true)}>
                Edit details
              </button>
            )}
            {status === "Open" && (
              <button className={button} disabled={saving} onClick={() => changeStatus("In Review")}>
                Start Review
              </button>
            )}
            {status === "In Review" && (
              <button className={button} disabled={saving} onClick={() => changeStatus("Rejected")}>
                Reject
              </button>
            )}
            {status === "Approved" && (
              <button className={button} disabled={saving} onClick={() => changeStatus("Completed")}>
                Mark Completed
              </button>
            )}
            {canRemove && (
              <button
                className={`${button} text-red-700`}
                disabled={saving}
                onClick={() => {
                  if (window.confirm("Remove this return from the desk?")) save("DELETE");
                }}
              >
                Remove
              </button>
            )}
          </div>
        )}
      </section>

      {editing && (
        <ReturnForm
          initialValues={item}
          submitLabel="Save changes"
          isSubmitting={saving}
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            if (await save("PATCH", "", values)) setEditing(false);
          }}
        />
      )}

      {status === "In Review" && !editing && (
        <form className={`${panel} space-y-3`} onSubmit={approve}>
          <label className="block">
            Resolution
            <select
              className={input}
              required
              value={resolution}
              onChange={(event) => {
                setResolution(event.target.value);
                setRefundAmount("");
              }}
            >
              <option value="">Select a resolution</option>
              <option>Refund</option>
              <option>Replacement</option>
              <option>Store Credit</option>
            </select>
          </label>
          {resolution === "Refund" && (
            <label className="block">
              Refund amount
              <input
                className={input}
                type="number"
                min="0.01"
                max="99999999.99"
                step="0.01"
                required
                value={refundAmount}
                onChange={(event) => setRefundAmount(event.target.value)}
              />
            </label>
          )}
          <button type="submit" className={button} disabled={saving}>Approve</button>
        </form>
      )}

      <section className={panel}>
        <h2 className="font-semibold">Notes</h2>
        {item.notes.length === 0 ? (
          <p className="my-2 text-sm text-slate-600">No notes yet.</p>
        ) : (
          <ol className="my-3 space-y-2">
            {item.notes.map((note) => (
              <li key={note.id} className="whitespace-pre-wrap break-words border-b border-slate-200 pb-2">
                {note.body}
              </li>
            ))}
          </ol>
        )}
        <form onSubmit={addNote}>
          <label className="block">
            Add a note
            <textarea name="body" className={input} rows={3} maxLength={2000} required />
          </label>
          <button type="submit" className={`${button} mt-2`} disabled={saving}>Add note</button>
        </form>
      </section>
    </div>
  );
}

export default function ReturnDetailsPage() {
  const { id } = useParams();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-4 inline-block text-blue-800 hover:underline">
          Back to returns
        </Link>
        <ReturnDetails key={id} id={id} />
      </div>
    </main>
  );
}