"use client";

import { useState } from "react";
import ReturnForm from "../../../components/ReturnForm";

export default function NewReturnPage() {
  const [feedback, setFeedback] = useState(null);

  function previewReturn(values) {
    if (!values.customer_name || !values.order_id || !values.item_id) {
      setFeedback({ error: true, message: "Enter a customer name, order ID, and item ID." });
      return;
    }

    setFeedback({
      error: false,
      message: `Form validated for ${values.customer_name}. Saving will be available when the API is connected.`,
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-semibold">New Return</h1>
        <ReturnForm onSubmit={previewReturn} />
        {feedback && (
          <p
            role={feedback.error ? "alert" : "status"}
            className={feedback.error ? "mt-4 text-red-700" : "mt-4 text-slate-700"}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </main>
  );
}