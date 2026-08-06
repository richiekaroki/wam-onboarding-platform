// frontend/src/app/forms/[slug]/page.tsx
"use client";

import FormRenderer from "@/components/FormRenderer";
import { submitForm, getForm } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface FormData {
  id: string;
  name: string;
  slug: string;
  description: string;
  schema_version: number;
  fields: {
    id: string;
    key: string;
    label: string;
    field_type: "text" | "number" | "date" | "dropdown" | "checkbox" | "file" | "email" | "textarea";
    required: boolean;
    options: { value: string; label: string }[] | string[] | null;
    conditional_required?: {
      depends_on: string;
      operator: "gt" | "lt" | "eq" | "gte" | "lte" | "ne";
      value: number | string;
      message?: string;
    };
    validation: Record<string, unknown> | null;
    help_text: string;
    placeholder: string;
    order: number;
  }[];
}

export default function ClientFormPage() {
  const { slug }            = useParams<{ slug: string }>();
  const [form, setForm]     = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!slug) return;
    getForm(slug)
      .then(setForm)
      .catch(() => setError("This form could not be found or is no longer available."))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (
    formId: string,
    textValues: Record<string, unknown>,
    files: Record<string, File | File[]>
  ) => {
    await submitForm(formId, textValues, files);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <span
            className="animate-spin"
            style={{
              width: "2rem", height: "2rem",
              border: "2px solid var(--color-ink-100)",
              borderTopColor: "var(--color-ink-900)",
              borderRadius: "50%",
              display: "inline-block",
            }}
          />
          <p className="text-sm" style={{ color: "var(--color-ink-400)" }}>Loading form…</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <div className="card text-center py-16 max-w-md">
          <p className="text-sm" style={{ color: "var(--color-ink-400)" }}>{error ?? "Form not found."}</p>
          <button onClick={() => router.push("/forms")} className="btn-secondary mt-6" style={{ borderColor: "var(--color-ink-200)", color: "var(--color-ink-700)", backgroundColor: "transparent" }}>
            ← Back to forms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--color-surface)" }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-[var(--color-surface)] focus:px-4 focus:py-2 focus:shadow-lg focus:outline-none" style={{ color: "var(--color-ink-900)" }}>
        Skip to main content
      </a>

      <main id="main-content" style={{ maxWidth: "640px", margin: "0 auto" }}>

        <Link
          href="/forms"
          className="text-xs font-mono tracking-widest uppercase transition-colors"
          style={{ color: "var(--color-ink-400)" }}
        >
          ← All forms
        </Link>

        {submitted ? (
          <div className="card text-center py-16 mt-8 animate-fade-up">
            <div
              className="mx-auto mb-4 flex items-center justify-center"
              style={{
                width: "3rem", height: "3rem",
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: "50%",
                fontSize: "1.25rem",
                color: "#15803D",
              }}
            >
              ✓
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "var(--color-ink-900)" }}>
              Submission received
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--color-ink-400)" }}>
              Your {form.name} has been submitted. An admin will review it shortly.
            </p>
            <button
              onClick={() => router.push("/forms")}
              className="btn-secondary mt-8"
              style={{ borderColor: "var(--color-ink-200)", color: "var(--color-ink-700)", backgroundColor: "transparent" }}
            >
              Submit another form
            </button>
          </div>
        ) : (
          <div className="mt-8 animate-fade-up">
            <div className="page-header">
              <h1 className="page-title">{form.name}</h1>
              {form.description && (
                <p className="page-subtitle">{form.description}</p>
              )}
            </div>

            <div className="mb-8 text-xs font-mono" style={{ color: "var(--color-ink-300)" }}>
              <span>{form.fields.length} field{form.fields.length !== 1 ? "s" : ""}</span>
            </div>

            <FormRenderer
              fields={form.fields}
              formId={form.id}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </main>
    </div>
  );
}