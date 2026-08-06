// frontend/src/components/FormRenderer.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, UseFormRegister, FieldErrors } from "react-hook-form";

// The backend stores fields as Field model rows returned in the `fields`
// array of the Form response — not inside schema.fields.
// This component accepts that array directly.
export interface FormFieldDef {
  id: string;
  key: string;
  label: string;
  field_type: "text" | "number" | "date" | "dropdown" | "checkbox" | "file" | "email" | "textarea";
  required?: boolean;
  options?: { value: string; label: string }[] | string[] | null;
  // Conditional validation rule from the field's validation JSON
  conditional_required?: {
    depends_on: string;
    operator: "gt" | "lt" | "eq" | "gte" | "lte" | "ne";
    value: number | string;
    message?: string;
  };
  help_text?: string;
  placeholder?: string;
  order: number;
}

interface Props {
  fields: FormFieldDef[];
  formId: string;
  maxFileSize?: number; // in bytes, defaults to 5MB
  onSubmit: (
    formId: string,
    textValues: Record<string, unknown>,
    files: Record<string, File | File[]>
  ) => Promise<void>;
}

  const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB (must match backend MAX_UPLOAD_SIZE)
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "text/csv",
  "application/vnd.ms-excel",
];

function evaluateConditional(
  conditional: NonNullable<FormFieldDef["conditional_required"]>,
  dependentValue: unknown
): boolean {
  const { operator, value } = conditional;
  const depNum = parseFloat(String(dependentValue));
  const refNum = typeof value === "number" ? value : parseFloat(String(value));

  // Use numeric comparison when both sides are valid numbers
  const numericOps = ["gt", "gte", "lt", "lte"];
  if (numericOps.includes(operator) && !isNaN(depNum) && !isNaN(refNum)) {
    switch (operator) {
      case "gt":  return depNum >  refNum;
      case "gte": return depNum >= refNum;
      case "lt":  return depNum <  refNum;
      case "lte": return depNum <= refNum;
    }
  }

  // String/equality comparison
  const depStr = String(dependentValue ?? "");
  const refStr = String(value);
  switch (operator) {
    case "eq": return depStr === refStr;
    case "ne": return depStr !== refStr;
    default:   return false;
  }
}

// ── Single field renderer ────────────────────────────────────────────────────
interface FieldInputProps {
  field: FormFieldDef;
  allFields: FormFieldDef[];
  register: UseFormRegister<Record<string, unknown>>;
  errors: FieldErrors<Record<string, unknown>>;
  watchedValues: Record<string, unknown>;
  maxFileBytes: number;
}

function FieldInput({ field, allFields, register, errors, watchedValues, maxFileBytes }: FieldInputProps) {
  const error = errors[field.key];

  const isConditionallyRequired = field.conditional_required
    ? evaluateConditional(
        field.conditional_required,
        watchedValues[field.conditional_required.depends_on]
      )
    : false;

  const isRequired = field.required || isConditionallyRequired;
  const requiredMsg = isConditionallyRequired
    ? (field.conditional_required?.message ?? `${field.label} is required`)
    : `${field.label} is required`;

  const baseClass =
    "w-full border px-4 py-3 text-sm outline-none transition-colors " +
    "focus:border-[var(--color-ink-900)] focus:shadow-[0_0_0_1px_var(--color-ink-900)] " +
    (error
      ? "border-red-400 bg-red-50"
      : "border-[var(--color-ink-200)] bg-[var(--color-surface-raised)]");

  // Normalise options to { value, label } shape regardless of source format
  const normaliseOptions = (
    raw: FormFieldDef["options"]
  ): { value: string; label: string }[] => {
    if (!raw) return [];
    return raw.map((o) =>
      typeof o === "string" ? { value: o, label: o } : o
    );
  };

  return (
    <div className="mb-6">
      {field.field_type !== "checkbox" && (
        <label className="label">
          {field.label}
          {isRequired && (
            <span style={{ color: "var(--color-gold)", marginLeft: "0.25rem" }}>*</span>
          )}
          {isConditionallyRequired && (
            <span
              className="ml-2 text-[11px] normal-case tracking-normal"
              style={{ color: "var(--color-status-reviewed)" }}
              title={`Required when "${allFields.find((f) => f.key === field.conditional_required?.depends_on)?.label ?? field.conditional_required?.depends_on}" ${field.conditional_required?.operator ?? "is"} ${field.conditional_required?.value ?? "provided"}`}
            >
              (conditionally required)
            </span>
          )}
        </label>
      )}

      {field.help_text && (
        <p className="text-xs mb-2" style={{ color: "var(--color-ink-400)" }}>
          {field.help_text}
        </p>
      )}

      {/* ── text / email / number / date ── */}
      {(["text", "email", "number", "date"] as const).includes(
        field.field_type as "text" | "email" | "number" | "date"
      ) && (
        <input
          type={field.field_type}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          {...register(field.key, { required: isRequired ? requiredMsg : false })}
          className={baseClass}
        />
      )}

      {/* ── textarea ── */}
      {field.field_type === "textarea" && (
        <textarea
          rows={4}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          {...register(field.key, { required: isRequired ? requiredMsg : false })}
          className={baseClass + " resize-none"}
        />
      )}

      {/* ── dropdown ── */}
      {field.field_type === "dropdown" && (
        <select
          {...register(field.key, { required: isRequired ? requiredMsg : false })}
          className={baseClass}
        >
          <option value="">Select an option…</option>
          {normaliseOptions(field.options).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}

      {/* ── checkbox ── */}
      {field.field_type === "checkbox" && (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register(field.key, { required: isRequired ? requiredMsg : false })}
            className="mt-0.5 h-4 w-4 accent-(--color-ink-900)"
          />
          <span className="text-sm" style={{ color: "var(--color-ink-700)" }}>
            {field.label}
            {isRequired && (
              <span style={{ color: "var(--color-gold)", marginLeft: "0.25rem" }}>*</span>
            )}
          </span>
        </label>
      )}

      {/* ── file ── */}
      {field.field_type === "file" && (
        <>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            {...register(field.key, {
              required: false,
              validate: (files: unknown) => {
                const fl = files as FileList;
                if (!fl || fl.length === 0) return isRequired ? requiredMsg : true;
                for (let i = 0; i < fl.length; i++) {
                  if (fl[i].size > maxFileBytes)
                    return `"${fl[i].name}" exceeds the ${Math.round(maxFileBytes / 1024 / 1024)} MB limit`;
                  if (!ALLOWED_MIME_TYPES.includes(fl[i].type))
                    return `"${fl[i].name}" is not an allowed file type (PDF, JPG, PNG, DOC, DOCX)`;
                }
                return true;
              },
            })}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                       file:border-0 file:text-sm file:font-medium
                       file:bg-(--color-ink-50) file:text-(--color-ink-700)
                       hover:file:bg-(--color-ink-100) cursor-pointer"
          />
          <p className="text-xs mt-1" style={{ color: "var(--color-ink-400)" }}>
            Max 5 MB per file · PDF, JPG, PNG, DOC, DOCX · Multiple files allowed
          </p>
        </>
      )}

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-600">
          {error.message as string}
        </p>
      )}
    </div>
  );
}

// ── Main renderer ────────────────────────────────────────────────────────────
export default function FormRenderer({ fields, formId, maxFileSize, onSubmit }: Props) {
  const maxFileBytes = maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Record<string, unknown>>();

  const watchedValues = watch();

  // Focus error banner when submit error appears
  useEffect(() => {
    if (submitError && errorRef.current) {
      errorRef.current.focus();
    }
  }, [submitError]);

  const onFormSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const textValues: Record<string, unknown> = {};
      const files: Record<string, File | File[]> = {};

      for (const [key, value] of Object.entries(data)) {
        if (value instanceof FileList && value.length > 0) {
          files[key] = value.length === 1 ? value[0] : Array.from(value);
        } else if (value !== undefined && value !== null && value !== "") {
          textValues[key] = value;
        }
      }

      await onSubmit(formId, textValues, files);
      setSubmitSuccess(true);
      reset();
      setTimeout(() => setSubmitSuccess(false), 6000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { responses?: string; detail?: string } }; message?: string };
      setSubmitError(
        err.response?.data?.responses ??
        err.response?.data?.detail ??
        err.message ??
        "Submission failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  if (sortedFields.length === 0) {
    return (
      <div className="card text-center py-12">
        <p style={{ color: "var(--color-ink-400)", fontSize: "0.875rem" }}>
          This form has no fields configured yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {submitSuccess && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 text-green-800 text-sm">
          ✓ Form submitted successfully. An admin has been notified.
        </div>
      )}

      {submitError && (
        <div ref={errorRef} tabIndex={-1} role="alert" className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-800 text-sm" style={{ outline: "none" }}>
          ✗ {submitError}
        </div>
      )}

      <form onSubmit={onFormSubmit}>
        {sortedFields.map((field) => (
          <FieldInput
            key={field.id}
            field={field}
            allFields={sortedFields}
            register={register as UseFormRegister<Record<string, unknown>>}
            errors={errors}
            watchedValues={watchedValues}
            maxFileBytes={maxFileBytes}
          />
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem", backgroundColor: "#0D1117", color: "#F5F4F0", display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.025em", border: "none", borderRadius: "4px", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.6 : 1 }}
        >
          {isSubmitting ? (
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                className="animate-spin"
                style={{
                  width: "1rem", height: "1rem",
                  border: "2px solid var(--color-ink-200)",
                  borderTopColor: "var(--color-ink-inverse)",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              />
              Submitting…
            </span>
          ) : (
            "Submit form"
          )}
        </button>
      </form>
    </div>
  );
}