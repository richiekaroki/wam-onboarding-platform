// frontend/src/app/admin/forms/create/page.tsx
"use client";

import { createForm, createField } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import VisualFormBuilder, { SectionDef } from "@/components/VisualFormBuilder";

export default function CreateFormPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateSlug = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSubmit = async (sections: SectionDef[]) => {
    if (!name || !slug) {
      setError("Please fill in the form name and slug.");
      return;
    }

    const allFields = sections.flatMap((s) => s.fields);
    if (allFields.length === 0 || !allFields.some((f) => f.label)) {
      setError("Please add at least one field.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Build schema from sections
      const schema = {
        sections: sections.map((s) => ({
          name: s.name,
          fields: s.fields.filter((f) => f.label).map((f) => ({
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
            conditional: f.conditional?.enabled ? {
              source_field: f.conditional.source_field,
              operator: f.conditional.operator,
              value: f.conditional.value,
            } : undefined,
          })),
        })),
        // Flat fields array for backward compatibility
        fields: sections.flatMap((s) =>
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
            conditional: f.conditional?.enabled ? {
              source_field: f.conditional.source_field,
              operator: f.conditional.operator,
              value: f.conditional.value,
            } : undefined,
          }))
        ),
      };

      // Step 1: create the Form record
      const created = await createForm({
        name,
        slug,
        description,
        schema,
        is_active: isActive,
      });

      // Step 2: create each Field row
      const flatFields = schema.fields;
      for (let i = 0; i < flatFields.length; i++) {
        const f = flatFields[i];
        await createField(created.slug, {
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

      router.push("/admin");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { slug?: string[]; name?: string[]; detail?: string } } };
      setError(
        e.response?.data?.slug?.[0] ??
        e.response?.data?.name?.[0] ??
        e.response?.data?.detail ??
        "Failed to create form. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label className="label" style={{ marginBottom: "0.25rem" }}>Form name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                const v = e.target.value;
                setName(v);
                if (!slug) setSlug(generateSlug(v));
              }}
              placeholder="e.g. KYC Application"
              className="input"
              style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label className="label" style={{ marginBottom: "0.25rem" }}>Slug (URL) *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="e.g. kyc-application"
              className="input"
              style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--color-ink-300)", fontFamily: "var(--font-mono)" }}>
              /forms/{slug || "your-slug"}
            </p>
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label className="label" style={{ marginBottom: "0.25rem" }}>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className="input"
              style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "1.25rem" }}>
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ accentColor: "var(--color-ink-900)" }}
            />
            <label htmlFor="is_active" style={{ fontSize: "0.8rem", color: "var(--color-ink-600)", cursor: "pointer" }}>
              Publish
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1rem 1.5rem 0" }}>
          <p className="text-sm px-4 py-3 bg-red-50 border border-red-200 text-red-700">
            {error}
          </p>
        </div>
      )}

      <VisualFormBuilder
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel={loading ? "Creating…" : "Create form"}
      />
    </div>
  );
}
