"use client";

import Link from "next/link";
import { useState } from "react";
import ReturnForm from "../../../components/ReturnForm";

export default function NewReturnPage() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  async function createReturn(values) {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error?.message || "Could not create the return.");
        return;
      }

      if (!result?.data?.reference) {
        setError("The server did not confirm the return. Check the dashboard before retrying.");
        return;
      }

      setReference(result.data.reference);
    } catch {
      setError("Could not reach the returns API. Check the dashboard before retrying.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-semibold">New Return</h1>

        {reference ? (
          <div className="rounded-lg border border-emerald-200 bg-white p-4">
            <p role="status">Return {reference} was created.</p>
            <Link href="/" className="mt-3 inline-block text-blue-800 hover:underline">
              Back to returns
            </Link>
          </div>
        ) : (
          <ReturnForm onSubmit={createReturn} isSubmitting={saving} />
        )}

        {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      </div>
    </main>
  );
}