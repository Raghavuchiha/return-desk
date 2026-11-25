"use client";

import Link from "next/link";

const reasons = [
  "Damaged",
  "Wrong Item",
  "Size Issue",
  "Not As Described",
  "Changed Mind",
];

const fields = [
  { name: "customer_name", label: "Customer name", maxLength: 100 },
  { name: "customer_email", label: "Customer email", type: "email", maxLength: 255 },
  { name: "order_id", label: "Order ID", maxLength: 50 },
  { name: "item_id", label: "Item ID", maxLength: 50 },
  { name: "quantity", label: "Quantity", type: "number", min: 1, step: 1 },
];

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2";

export default function ReturnForm({
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Create Return",
  isSubmitting = false,
}) {
  function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    const data = new FormData(event.currentTarget);

    onSubmit({
      customer_name: data.get("customer_name").trim(),
      customer_email: data.get("customer_email").trim(),
      order_id: data.get("order_id").trim(),
      item_id: data.get("item_id").trim(),
      quantity: Number(data.get("quantity")),
      reason: data.get("reason"),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2"
    >
      {fields.map(({ label, name, type = "text", ...rules }) => (
        <label key={name} className="text-sm font-medium">
          {label}
          <input
            name={name}
            type={type}
            defaultValue={initialValues[name] ?? (name === "quantity" ? 1 : "")}
            className={inputClass}
            required
            {...rules}
          />
        </label>
      ))}

      <label className="text-sm font-medium">
        Reason
        <select
          name="reason"
          defaultValue={initialValues.reason ?? ""}
          className={inputClass}
          required
        >
          <option value="">Select a reason</option>
          {reasons.map((reason) => (
            <option key={reason}>{reason}</option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>

        {onCancel ? (
          <button type="button" onClick={onCancel} className="text-blue-800">
            Cancel
          </button>
        ) : (
          <Link href="/" className="text-blue-800">Cancel</Link>
        )}
      </div>
    </form>
  );
}