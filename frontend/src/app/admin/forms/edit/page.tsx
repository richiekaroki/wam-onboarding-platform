// frontend/src/app/admin/forms/edit/page.tsx
// Accessed as /admin/forms/edit?slug=form-slug
"use client";
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { getForm, updateForm, createField, deleteField } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import VisualFormBuilder, { SectionDef } from "@/components/VisualFormBuilder";
import { Suspense } from "react";

interface FieldRow {
  id: string;
  key: string;
  label: string;
  field_type: string;
  required: boolean;
  order: number;
  options: unknown;
  help_text: string;
  placeholder: string;
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  schema_version: number;
  fields: FieldRow[];
}

function EditFormPageInner() {
  const searchParams = useSearchParams();
  const slug         = searchParams.get("slug") ?? "";
  const router       = useRouter();

  const [form,       setForm]       = useState<FormData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  useEffect(() => {
    if (!slug) { router.push("/admin"); return; }
    getForm(slug)
      .then((data) => setForm(data))
      .catch(() => setError("Form not found."))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleMetaUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      await updateForm(slug, {
        name:        form.name,
        description: form.description,
        is_active:   form.is_active,
      });
      setSuccess("Form updated successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleBuilderSubmit = async (sections: SectionDef[]) => {
    if (!form) return;
    setSaving(true);
    setError("");

    try {
      // Update metadata
      await updateForm(slug, {
        name: form.name,
        description: form.description,
        is_active: form.is_active,
      });

      // Build flat fields from sections
      const newFields = sections.flatMap((s) =>
        s.fields.filter((f) => f.label).map((f) => ({
          key: f.key,
          label: f.label,
          field_type: f.field_type,
          required: f.required,
          placeholder: f.placeholder || "",
          help_text: f.help_text || "",
          options: f.field_type === "dropdown" ? (f.options || []).filter(Boolean) : undefined,
          currency: f.field_type === "currency" ? f.currency : undefined,
          max_file_size: f.field_type === "file" ? f.max_file_size : undefined,
          accepted_types: f.field_type === "file" ? f.accepted_types : undefined,
        }))
      );

      // Delete removed fields
      const existingIds = new Set(form.fields.map((f) => f.id));
      const builderKeys = new Set(newFields.map((f) => f.key));

      for (const field of form.fields) {
        if (!builderKeys.has(field.key)) {
          await deleteField(slug, field.id);
        }
      }

      // Create new fields (those in builder but not in existing)
      for (let i = 0; i < newFields.length; i++) {
        const f = newFields[i];
        const existingField = form.fields.find((ef) => ef.key === f.key);
        if (!existingField) {
          await createField(slug, {
            key: f.key,
            label: f.label,
            field_type: f.field_type,
            required: f.required ?? false,
            options: f.options ?? null,
            validation: null,
            order: i,
            placeholder: f.placeholder ?? "",
            help_text: f.help_text ?? "",
          });
        }
      }

      setSuccess("Form updated successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <span className="animate-spin" style={{ width: "2rem", height: "2rem", border: "2px solid var(--color-ink-100)", borderTopColor: "var(--color-ink-900)", borderRadius: "50%", display: "inline-block" }} />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <div className="card text-center py-16">
          <p style={{ color: "var(--color-ink-400)" }}>{error || "Form not found."}</p>
          <button onClick={() => router.push("/admin")} className="btn-secondary mt-6" style={{ borderColor: "var(--color-ink-200)", color: "var(--color-ink-700)", backgroundColor: "transparent" }}>← Back</button>
        </div>
      </div>
    );
  }

  // Convert existing fields to SectionDef format for the visual builder
  const initialSections: SectionDef[] = [
    {
      id: "existing-section",
      name: "Form Fields",
      fields: form.fields.sort((a, b) => a.order - b.order).map((f) => ({
        id: f.id,
        key: f.key,
        label: f.label,
        field_type: f.field_type as SectionDef["fields"][0]["field_type"],
        required: f.required,
        placeholder: f.placeholder,
        help_text: f.help_text,
        options: Array.isArray(f.options) ? (f.options as string[]) : undefined,
      })),
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface)" }}>
      <Navbar />

      {/* Form metadata bar */}
      <div
        style={{
          background: "var(--color-surface-raised)",
          borderBottom: "1px solid var(--color-ink-100)",
          padding: "1rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <button onClick={() => router.push("/admin")} className="text-xs font-mono tracking-widest uppercase mb-4 block" style={{ color: "var(--color-ink-400)" }}>
            ← Back to dashboard
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label className="label" style={{ marginBottom: "0.25rem" }}>Form name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => f ? { ...f, name: e.target.value } : f)}
                className="input"
                style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label className="label" style={{ marginBottom: "0.25rem" }}>Slug (URL)</label>
              <input
                type="text"
                value={form.slug}
                disabled
                className="input"
                style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem", background: "var(--color-surface-sunken)", cursor: "not-allowed" }}
              />
              <p className="text-xs mt-1" style={{ color: "var(--color-ink-300)", fontFamily: "var(--font-mono)" }}>
                /forms/{form.slug}
              </p>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label className="label" style={{ marginBottom: "0.25rem" }}>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => f ? { ...f, description: e.target.value } : f)}
                className="input"
                style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "1.25rem" }}>
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm((f) => f ? { ...f, is_active: e.target.checked } : f)}
                style={{ accentColor: "var(--color-ink-900)" }}
              />
              <label htmlFor="is_active" style={{ fontSize: "0.8rem", color: "var(--color-ink-600)", cursor: "pointer" }}>
                Publish
              </label>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1rem 1.5rem 0" }}>
          <p className="text-sm px-4 py-3 bg-red-50 border border-red-200 text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1rem 1.5rem 0" }}>
          <p className="text-sm px-4 py-3 bg-green-50 border border-green-200 text-green-700">{success}</p>
        </div>
      )}

      <VisualFormBuilder
        initialSections={initialSections}
        onSubmit={handleBuilderSubmit}
        onCancel={() => router.back()}
        submitLabel={saving ? "Saving…" : "Save changes"}
      />
    </div>
  );
}

export default function EditFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <EditFormPageInner />
    </Suspense>
  );
}
