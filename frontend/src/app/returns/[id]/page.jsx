"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import ReturnForm from "../../../components/ReturnForm";
import { sampleReturns } from "../../../lib/sampleReturns";

const buttonClass = "rounded-md border border-slate-300 px-3 py-2 text-sm font-medium";
const inputClass = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2";

function ReturnDetails({ initialReturn }) {
  const [details, setDetails] = useState({
    customer_name: initialReturn.customer,
    customer_email: initialReturn.email,
    order_id: initialReturn.order,
    item_id: "DEMO-ITEM-" + initialReturn.id,
    quantity: 1,
    reason: initialReturn.reason,
  });
  const [status, setStatus] = useState(initialReturn.status);
  const [resolution, setResolution] = useState(
    ["Approved", "Completed"].includes(initialReturn.status) ? "Replacement" : "",
  );
  const [refund, setRefund] = useState("");
  const [notes, setNotes] = useState([]);
  const [editing, setEditing] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState("");

  const canEdit = status === "Open" || status === "In Review";
  const canRemove = status === "Open" || status === "Rejected";

  function saveDetails(values) {
    if (!values.customer_name || !values.order_id || !values.item_id) {
      setError("Enter a customer name, order ID, and item ID.");
      return;
    }

    setDetails(values);
    setError("");
    setEditing(false);
  }

  function approve(event) {
    event.preventDefault();
    setStatus("Approved");
  }

  function addNote(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const note = new FormData(form).get("note").trim();

    if (!note) return;
    setNotes([...notes, note]);
    form.reset();
  }

  if (removed) {
    return <p role="status">Request removed from this preview.</p>;
  }

  return (
    <>
      <h1 className="mb-4 text-3xl font-semibold">{initialReturn.reference}</h1>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 font-semibold" role="status">{status}</p>
        <dl className="grid gap-3 break-words text-sm sm:grid-cols-2">
          {[
            ["Customer", details.customer_name],
            ["Email", details.customer_email],
            ["Order ID", details.order_id],
            ["Item ID", details.item_id],
            ["Quantity", details.quantity],
            ["Reason", details.reason],
            ...(["Approved", "Completed"].includes(status)
              ? [["Resolution", resolution], ...(refund ? [["Refund amount", refund]] : [])]
              : []),
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-slate-600">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        {!editing && (
          <div className="mt-4 flex flex-wrap gap-2">
            {canEdit && (
              <button className={buttonClass} onClick={() => setEditing(true)}>Edit details</button>
            )}
            {status === "Open" && (
              <button className={buttonClass} onClick={() => setStatus("In Review")}>Start Review</button>
            )}
            {status === "In Review" && (
              <button className={buttonClass} onClick={() => setStatus("Rejected")}>Reject</button>
            )}
            {status === "Approved" && (
              <button className={buttonClass} onClick={() => setStatus("Completed")}>Mark Completed</button>
            )}
            {canRemove && (
              <button
                className={buttonClass + " text-red-700"}
                onClick={() => {
                  if (window.confirm("Remove this request from the desk?")) setRemoved(true);
                }}
              >
                Remove
              </button>
            )}
          </div>
        )}
      </section>

      {editing && (
        <section className="mt-4">
          <h2 className="mb-2 font-semibold">Edit details</h2>
          <ReturnForm
            initialValues={details}
            onSubmit={saveDetails}
            onCancel={() => { setError(""); setEditing(false); }}
            submitLabel="Save changes"
          />
          {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
        </section>
      )}

      {status === "In Review" && !editing && (
        <form onSubmit={approve} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <label>
            Resolution
            <select
              required
              value={resolution}
              className={inputClass}
              onChange={(event) => {
                setResolution(event.target.value);
                setRefund("");
              }}
            >
              <option value="">Select a resolution</option>
              <option>Refund</option>
              <option>Replacement</option>
              <option>Store Credit</option>
            </select>
          </label>
          {resolution === "Refund" && (
            <label>
              Refund amount
              <input
                type="number"
                min="0.01"
                max="99999999.99"
                step="0.01"
                required
                value={refund}
                onChange={(event) => setRefund(event.target.value)}
                className={inputClass}
              />
            </label>
          )}
          <button className={buttonClass + " justify-self-start"}>Approve</button>
        </form>
      )}

      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Notes</h2>
        {notes.length === 0 ? (
          <p className="my-2 text-sm text-slate-600">No notes yet.</p>
        ) : (
          <ol className="my-2 space-y-2">
            {notes.map((note, index) => (
              <li key={index} className="whitespace-pre-wrap break-words border-b border-slate-200 pb-2">
                {note}
              </li>
            ))}
          </ol>
        )}
        <form onSubmit={addNote}>
          <label>
            Add a note
            <textarea name="note" required rows={3} className={inputClass} />
          </label>
          <button className={buttonClass + " mt-2"}>Add note</button>
        </form>
      </section>
    </>
  );
}

export default function ReturnDetailsPage() {
  const { id } = useParams();
  const entry = sampleReturns.find((item) => String(item.id) === id);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-4 inline-block text-blue-800 hover:underline">
          Back to returns
        </Link>
        {entry ? <ReturnDetails key={entry.id} initialReturn={entry} /> : <p>Return not found.</p>}
      </div>
    </main>
  );
}