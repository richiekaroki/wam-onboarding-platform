// frontend/src/components/VisualFormBuilder.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
export interface FieldDef {
  id: string;
  key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: string[];
  currency?: string;
  max_file_size?: number;
  accepted_types?: string[];
}

export interface SectionDef {
  id: string;
  name: string;
  fields: FieldDef[];
}

export type FieldType =
  | "text" | "email" | "phone" | "number" | "currency"
  | "date" | "textarea" | "dropdown" | "checkbox" | "file";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text input" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone number" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Long text" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File upload" },
];

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "KES", label: "KES (KSh)" },
];

const FILE_TYPES = [
  { value: "application/pdf", label: "PDF" },
  { value: "image/jpeg", label: "JPG" },
  { value: "image/png", label: "PNG" },
  { value: "application/msword", label: "DOC" },
  { value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "DOCX" },
];

function uid() {
  return `field-${crypto.randomUUID().slice(0, 8)}`;
}

function makeField(): FieldDef {
  return {
    id: uid(),
    key: "",
    label: "",
    field_type: "text",
    required: false,
    placeholder: "",
    help_text: "",
    options: [],
    currency: "USD",
    max_file_size: 5,
    accepted_types: ["application/pdf", "image/jpeg", "image/png"],
  };
}

function makeSection(): SectionDef {
  return { id: uid(), name: "New Section", fields: [makeField()] };
}

// ── Field Card ─────────────────────────────────────────────────────────────
interface FieldCardProps {
  field: FieldDef;
  onChange: (field: FieldDef) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function FieldCard({ field, onChange, onRemove, onDuplicate, onDragStart, onMoveUp, onMoveDown, isFirst, isLast }: FieldCardProps) {
  const [expanded, setExpanded] = useState(false);

  const update = (partial: Partial<FieldDef>) => {
    onChange({ ...field, ...partial });
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        background: "var(--color-surface-raised)",
        border: "1px solid var(--color-ink-100)",
        borderRadius: "4px",
        marginBottom: "0.5rem",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Drag handle */}
        <span
          style={{ cursor: "grab", color: "var(--color-ink-300)", fontSize: "1rem", userSelect: "none" }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          ≡
        </span>

        {/* Field name */}
        <input
          type="text"
          value={field.label}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const label = e.target.value;
            const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "") || `field_${Date.now()}`;
            update({ label, key });
          }}
          placeholder="Field name"
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontSize: "0.875rem",
            fontFamily: "var(--font-body)",
            color: "var(--color-ink-900)",
            outline: "none",
            padding: 0,
          }}
        />

        {/* Type selector */}
        <select
          value={field.field_type}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => update({ field_type: e.target.value as FieldType })}
          style={{
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono)",
            padding: "0.25rem 0.5rem",
            border: "1px solid var(--color-ink-200)",
            borderRadius: "4px",
            background: "var(--color-surface)",
            color: "var(--color-ink-600)",
            cursor: "pointer",
          }}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Required toggle */}
        <label
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "0.75rem",
            color: "var(--color-ink-400)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => update({ required: e.target.checked })}
            style={{ accentColor: "var(--color-ink-900)" }}
          />
          Req
        </label>

        {/* Remove button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-ink-300)",
            cursor: "pointer",
            padding: "0.25rem",
            fontSize: "0.875rem",
            lineHeight: 1,
          }}
          title="Remove field"
        >
          ×
        </button>

        {/* Move up/down buttons for keyboard accessibility */}
        {onMoveUp && !isFirst && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-ink-300)",
              cursor: "pointer",
              padding: "0.25rem",
              fontSize: "0.7rem",
              lineHeight: 1,
            }}
            title="Move field up"
            aria-label="Move field up"
          >
            ▲
          </button>
        )}
        {onMoveDown && !isLast && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-ink-300)",
              cursor: "pointer",
              padding: "0.25rem",
              fontSize: "0.7rem",
              lineHeight: 1,
            }}
            title="Move field down"
            aria-label="Move field down"
          >
            ▼
          </button>
        )}

        {/* Duplicate button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-ink-300)",
            cursor: "pointer",
            padding: "0.25rem",
            fontSize: "0.7rem",
            lineHeight: 1,
          }}
          title="Duplicate field"
          aria-label="Duplicate field"
        >
          ⧉
        </button>
      </div>

      {/* Expanded config */}
      {expanded && (
        <div
          style={{
            padding: "0 1rem 1rem",
            borderTop: "1px solid var(--color-ink-100)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            paddingTop: "0.75rem",
          }}
        >
          {/* Placeholder */}
          {["text", "email", "phone", "number", "currency", "date", "textarea"].includes(field.field_type) && (
            <div>
              <label className="label" style={{ marginBottom: "0.25rem" }}>Placeholder</label>
              <input
                type="text"
                value={field.placeholder || ""}
                onChange={(e) => update({ placeholder: e.target.value })}
                placeholder={`Enter ${field.label.toLowerCase() || "value"}`}
                className="input"
                style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
              />
            </div>
          )}

          {/* Help text */}
          <div>
            <label className="label" style={{ marginBottom: "0.25rem" }}>Help text</label>
            <input
              type="text"
              value={field.help_text || ""}
              onChange={(e) => update({ help_text: e.target.value })}
              placeholder="Optional help text shown below the field"
              className="input"
              style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
            />
          </div>

          {/* Dropdown options */}
          {field.field_type === "dropdown" && (
            <div>
              <label className="label" style={{ marginBottom: "0.25rem" }}>Options</label>
              {(field.options || []).map((opt, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.375rem" }}>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const opts = [...(field.options || [])];
                      opts[i] = e.target.value;
                      update({ options: opts });
                    }}
                    className="input"
                    style={{ flex: 1, fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
                    placeholder={`Option ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const opts = (field.options || []).filter((_, j) => j !== i);
                      update({ options: opts });
                    }}
                    style={{
                      background: "none", border: "none", color: "var(--color-ink-300)",
                      cursor: "pointer", fontSize: "1rem",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => update({ options: [...(field.options || []), ""] })}
                style={{
                  fontSize: "0.75rem", color: "var(--color-ink-600)",
                  background: "none", border: "none", cursor: "pointer",
                  padding: 0, textAlign: "left",
                }}
              >
                + Add option
              </button>
            </div>
          )}

          {/* Currency selector */}
          {field.field_type === "currency" && (
            <div>
              <label className="label" style={{ marginBottom: "0.25rem" }}>Currency</label>
              <select
                value={field.currency || "USD"}
                onChange={(e) => update({ currency: e.target.value })}
                className="input"
                style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* File upload config */}
          {field.field_type === "file" && (
            <>
              <div>
                <label className="label" style={{ marginBottom: "0.25rem" }}>Max file size (MB)</label>
                <select
                  value={field.max_file_size || 5}
                  onChange={(e) => update({ max_file_size: Number(e.target.value) })}
                  className="input"
                  style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
                >
                  <option value={1}>1 MB</option>
                  <option value={5}>5 MB</option>
                  <option value={10}>10 MB</option>
                  <option value={25}>25 MB</option>
                </select>
              </div>
              <div>
                <label className="label" style={{ marginBottom: "0.25rem" }}>Accepted file types</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {FILE_TYPES.map((ft) => (
                    <label
                      key={ft.value}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.25rem",
                        fontSize: "0.75rem", color: "var(--color-ink-600)", cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={(field.accepted_types || []).includes(ft.value)}
                        onChange={(e) => {
                          const types = field.accepted_types || [];
                          const updated = e.target.checked
                            ? [...types, ft.value]
                            : types.filter((t) => t !== ft.value);
                          update({ accepted_types: updated });
                        }}
                        style={{ accentColor: "var(--color-ink-900)" }}
                      />
                      {ft.label}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Key (auto-generated) */}
          <div>
            <label className="label" style={{ marginBottom: "0.25rem" }}>Field key</label>
            <input
              type="text"
              value={field.key}
              readOnly
              style={{
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                color: "var(--color-ink-400)",
                background: "var(--color-surface)",
                border: "1px solid var(--color-ink-100)",
                borderRadius: "4px",
                padding: "0.5rem 0.75rem",
                width: "100%",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section Component ──────────────────────────────────────────────────────
interface SectionProps {
  section: SectionDef;
  onChange: (section: SectionDef) => void;
  onRemove: () => void;
  onDragStartField: (sectionId: string, fieldIndex: number) => (e: React.DragEvent) => void;
  onDropField: (sectionId: string, fieldIndex: number) => void;
  fieldSearch: string;
}

function Section({ section, onChange, onRemove, onDragStartField, onDropField, fieldSearch }: SectionProps) {
  const updateField = (index: number, field: FieldDef) => {
    const fields = [...section.fields];
    fields[index] = field;
    onChange({ ...section, fields });
  };

  const removeField = (index: number) => {
    if (section.fields.length <= 1) return;
    if (!window.confirm("Delete this field? This cannot be undone.")) return;
    const fields = section.fields.filter((_, i) => i !== index);
    onChange({ ...section, fields });
  };

  const duplicateField = (index: number) => {
    const original = section.fields[index];
    const clone: FieldDef = {
      ...JSON.parse(JSON.stringify(original)),
      id: `field_${Date.now()}`,
      label: `${original.label} (copy)`,
    };
    const fields = [...section.fields];
    fields.splice(index + 1, 0, clone);
    onChange({ ...section, fields });
  };

  const moveField = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= section.fields.length) return;
    const fields = [...section.fields];
    const [moved] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, moved);
    onChange({ ...section, fields });
  };

  const addField = () => {
    onChange({ ...section, fields: [...section.fields, makeField()] });
  };

  return (
    <div
      style={{
        border: "1px solid var(--color-ink-100)",
        borderRadius: "4px",
        marginBottom: "1rem",
        background: "var(--color-surface)",
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid var(--color-ink-100)",
        }}
      >
        <input
          type="text"
          value={section.name}
          onChange={(e) => onChange({ ...section, name: e.target.value })}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontSize: "0.875rem",
            fontWeight: 600,
            fontFamily: "var(--font-body)",
            color: "var(--color-ink-900)",
            outline: "none",
            padding: 0,
          }}
          placeholder="Section name"
        />
        {section.name !== "Personal Information" && (
          <button
            type="button"
            onClick={onRemove}
            style={{
              background: "none", border: "none", color: "var(--color-ink-300)",
              cursor: "pointer", fontSize: "1rem",
            }}
            title="Remove section"
          >
            ×
          </button>
        )}
      </div>

      {/* Fields */}
      <div style={{ padding: "0.75rem 1rem" }}>
        {(() => {
          const q = fieldSearch.toLowerCase().trim();
          const filtered = q
            ? section.fields.map((f, idx) => ({ f, idx })).filter(({ f }) =>
                f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q)
              )
            : section.fields.map((f, idx) => ({ f, idx }));
          if (filtered.length === 0 && q) {
            return (
              <p style={{ fontSize: "0.75rem", color: "var(--color-ink-400)", fontStyle: "italic", padding: "0.5rem 0" }}>
                No fields match "{fieldSearch}"
              </p>
            );
          }
          return filtered.map(({ f: field, idx: i }) => (
          <div
            key={field.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDropField(section.id, i); }}
          >
            <FieldCard
              field={field}
              onChange={(f) => updateField(i, f)}
              onRemove={() => removeField(i)}
              onDuplicate={() => duplicateField(i)}
              onDragStart={onDragStartField(section.id, i)}
              onMoveUp={() => moveField(i, "up")}
              onMoveDown={() => moveField(i, "down")}
              isFirst={i === 0}
              isLast={i === section.fields.length - 1}
            />
          </div>
          ));
        })()}

        <button
          type="button"
          onClick={addField}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 0.75rem",
            background: "none",
            border: "1px dashed var(--color-ink-200)",
            borderRadius: "4px",
            color: "var(--color-ink-400)",
            fontSize: "0.8rem",
            cursor: "pointer",
            width: "100%",
            justifyContent: "center",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          + Add field
        </button>
      </div>
    </div>
  );
}

// ── Preview Panel ──────────────────────────────────────────────────────────
function PreviewPanel({ sections }: { sections: SectionDef[] }) {
  const hasContent = sections.some((s) => s.fields.some((f) => f.label));

  if (!hasContent) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "var(--color-ink-300)",
          fontSize: "0.875rem",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        Add fields to see a live preview
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      {sections.map((section) => {
        const visibleFields = section.fields.filter((f) => f.label);
        if (visibleFields.length === 0) return null;

        return (
          <div key={section.id} style={{ marginBottom: "1.5rem" }}>
            {section.name && (
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.25rem",
                  color: "var(--color-ink-900)",
                  marginBottom: "1rem",
                  paddingBottom: "0.5rem",
                  borderBottom: "1px solid var(--color-ink-100)",
                }}
              >
                {section.name}
              </h3>
            )}
            {visibleFields.map((field) => (
              <PreviewField key={field.id} field={field} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function PreviewField({ field }: { field: FieldDef }) {
  const labelText = field.label || "Untitled field";
  const placeholder = field.placeholder || `Enter ${field.label.toLowerCase() || "value"}`;

  return (
    <div style={{ marginBottom: "1rem" }}>
      {field.field_type !== "checkbox" && (
        <label
          style={{
            display: "block",
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "var(--color-ink-700)",
            marginBottom: "0.375rem",
          }}
        >
          {labelText}
          {field.required && (
            <span style={{ color: "var(--color-gold)", marginLeft: "0.25rem" }}>*</span>
          )}
        </label>
      )}

      {field.help_text && (
        <p style={{ fontSize: "0.75rem", color: "var(--color-ink-400)", marginBottom: "0.375rem" }}>
          {field.help_text}
        </p>
      )}

      {["text", "email", "phone", "number", "date"].includes(field.field_type) && (
        <div
          style={{
            padding: "0.625rem 0.875rem",
            border: "1px solid var(--color-ink-200)",
            borderRadius: "4px",
            background: "var(--color-surface-raised)",
            fontSize: "0.8rem",
            color: "var(--color-ink-300)",
          }}
        >
          {placeholder}
        </div>
      )}

      {field.field_type === "currency" && (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div
            style={{
              padding: "0.625rem 0.75rem",
              border: "1px solid var(--color-ink-200)",
              borderRadius: "4px",
              background: "var(--color-ink-50)",
              fontSize: "0.8rem",
              color: "var(--color-ink-600)",
              minWidth: "60px",
            }}
          >
            {field.currency || "USD"}
          </div>
          <div
            style={{
              flex: 1,
              padding: "0.625rem 0.875rem",
              border: "1px solid var(--color-ink-200)",
              borderRadius: "4px",
              background: "var(--color-surface-raised)",
              fontSize: "0.8rem",
              color: "var(--color-ink-300)",
            }}
          >
            {placeholder}
          </div>
        </div>
      )}

      {field.field_type === "textarea" && (
        <div
          style={{
            padding: "0.625rem 0.875rem",
            border: "1px solid var(--color-ink-200)",
            borderRadius: "4px",
            background: "var(--color-surface-raised)",
            fontSize: "0.8rem",
            color: "var(--color-ink-300)",
            minHeight: "4rem",
          }}
        >
          {placeholder}
        </div>
      )}

      {field.field_type === "dropdown" && (
        <select
          disabled
          style={{
            width: "100%",
            padding: "0.625rem 0.875rem",
            border: "1px solid var(--color-ink-200)",
            borderRadius: "4px",
            background: "var(--color-surface-raised)",
            fontSize: "0.8rem",
            color: "var(--color-ink-300)",
          }}
        >
          <option>Select an option…</option>
          {(field.options || []).map((opt, i) => (
            <option key={i}>{opt || `Option ${i + 1}`}</option>
          ))}
        </select>
      )}

      {field.field_type === "checkbox" && (
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <input type="checkbox" disabled style={{ accentColor: "var(--color-ink-900)" }} />
          <span style={{ fontSize: "0.8rem", color: "var(--color-ink-700)" }}>
            {labelText}
            {field.required && (
              <span style={{ color: "var(--color-gold)", marginLeft: "0.25rem" }}>*</span>
            )}
          </span>
        </label>
      )}

      {field.field_type === "file" && (
        <div
          style={{
            padding: "1.5rem",
            border: "2px dashed var(--color-ink-200)",
            borderRadius: "4px",
            background: "var(--color-surface-raised)",
            textAlign: "center",
            fontSize: "0.8rem",
            color: "var(--color-ink-400)",
          }}
        >
          Click to upload or drag and drop
          <br />
          <span style={{ fontSize: "0.7rem" }}>
            Max {field.max_file_size || 5} MB
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
interface Props {
  initialSections?: SectionDef[];
  onSubmit: (sections: SectionDef[]) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export default function VisualFormBuilder({ initialSections, onSubmit, onCancel, submitLabel = "Create form" }: Props) {
  const [sections, setSections] = useState<SectionDef[]>(
    initialSections || [makeSection()]
  );
  const [dragSource, setDragSource] = useState<{ sectionId: string; fieldIndex: number } | null>(null);
  const [showHelpTip, setShowHelpTip] = useState(true);
  const [fieldSearch, setFieldSearch] = useState("");
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
  const isDirtyRef = useRef(false);
  const initialSectionsRef = useRef(initialSections);

  // Track changes for unsaved warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Mark dirty when sections change from initial
  useEffect(() => {
    isDirtyRef.current = JSON.stringify(sections) !== JSON.stringify(initialSectionsRef.current);
  }, [sections]);

  const updateSection = useCallback((index: number, section: SectionDef) => {
    setSections((prev) => {
      const next = [...prev];
      next[index] = section;
      return next;
    });
  }, []);

  const removeSection = useCallback((index: number) => {
    if (!window.confirm("Delete this section and all its fields? This cannot be undone.")) return;
    setSections((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addSection = () => {
    setSections((prev) => [...prev, makeSection()]);
  };

  const handleDragStartField = useCallback((sectionId: string, fieldIndex: number) => {
    return (e: React.DragEvent) => {
      setDragSource({ sectionId, fieldIndex });
      e.dataTransfer.effectAllowed = "move";
    };
  }, []);

  const handleDropField = useCallback((targetSectionId: string, targetFieldIndex: number) => {
    if (!dragSource) return;

    setSections((prev) => {
      const next = prev.map((s) => ({ ...s, fields: [...s.fields] }));
      const sourceSection = next.find((s) => s.id === dragSource.sectionId);
      const targetSection = next.find((s) => s.id === targetSectionId);

      if (!sourceSection || !targetSection) return prev;

      const [movedField] = sourceSection.fields.splice(dragSource.fieldIndex, 1);
      targetSection.fields.splice(targetFieldIndex, 0, movedField);

      return next;
    });

    setDragSource(null);
  }, [dragSource]);

  const handleSubmit = () => {
    isDirtyRef.current = false;
    onSubmit(sections);
  };

  return (
    <div className="vfb-layout">
      {/* Mobile tab bar */}
      <div className="vfb-mobile-tabs" role="tablist" aria-label="Form builder views">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "editor"}
          aria-controls="vfb-editor-panel"
          className="vfb-mobile-tab"
          onClick={() => setMobileTab("editor")}
        >
          Editor
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "preview"}
          aria-controls="vfb-preview-panel"
          className="vfb-mobile-tab"
          onClick={() => setMobileTab("preview")}
        >
          Preview
        </button>
      </div>

      {/* Editor panel */}
      <div
        id="vfb-editor-panel"
        role="tabpanel"
        className="vfb-editor"
        hidden={mobileTab !== "editor"}
      >
        {/* Contextual help */}
        {showHelpTip ? (
          <div
            style={{
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              background: "var(--color-info-bg)",
              border: "1px solid var(--color-info-border)",
              borderRadius: "4px",
              fontSize: "0.75rem",
              color: "var(--color-info)",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <span><strong>Tip:</strong> Add fields and organize them into sections. Drag fields to reorder. Use the preview panel to see how your form will look to clients.</span>
            <button
              type="button"
              onClick={() => setShowHelpTip(false)}
              style={{
                background: "none", border: "none", color: "var(--color-info)",
                cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: 0, flexShrink: 0,
              }}
              title="Dismiss tip"
              aria-label="Dismiss help tip"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowHelpTip(true)}
            style={{
              padding: "0.375rem 0.75rem",
              marginBottom: "1rem",
              background: "none",
              border: "1px dashed var(--color-ink-200)",
              borderRadius: "4px",
              fontSize: "0.7rem",
              color: "var(--color-ink-400)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            ? Show tips
          </button>
        )}

        {/* Field search filter */}
        {sections.some((s) => s.fields.length > 0) && (
          <div style={{ marginBottom: "0.75rem" }}>
            <input
              type="search"
              placeholder="Search fields by label or key…"
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              aria-label="Search form fields"
              className="input"
              style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
            />
          </div>
        )}

        {/* Section controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {sections.map((section, i) => (
            <Section
              key={section.id}
              section={section}
              onChange={(s) => updateSection(i, s)}
              onRemove={() => removeSection(i)}
              onDragStartField={handleDragStartField}
              onDropField={handleDropField}
              fieldSearch={fieldSearch}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addSection}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
            padding: "0.75rem",
            background: "none",
            border: "1px dashed var(--color-ink-200)",
            borderRadius: "4px",
            color: "var(--color-ink-400)",
            fontSize: "0.8rem",
            cursor: "pointer",
            width: "100%",
            marginTop: "0.5rem",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          + Add section
        </button>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--color-ink-100)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (isDirtyRef.current && !window.confirm("You have unsaved changes. Discard them?")) return;
              onCancel();
            }}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="btn-primary">
            {submitLabel}
          </button>
        </div>
      </div>

      {/* Preview panel */}
      <div
        id="vfb-preview-panel"
        role="tabpanel"
        aria-label="Live form preview"
        className="vfb-preview"
        hidden={mobileTab !== "preview"}
      >
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid var(--color-ink-100)",
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "var(--color-ink-400)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Live Preview
        </div>
        <PreviewPanel sections={sections} />
      </div>
    </div>
  );
}
