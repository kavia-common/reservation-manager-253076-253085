import React, { useMemo, useState } from "react";

/**
 * ReservationForm
 * A controlled form component for creating or editing reservations with client-side validation.
 *
 * Props:
 * - onSubmit: (data) => Promise<void> | void - handler to process valid form data
 * - initialValues?: object - default values for editing flow
 * - submitting?: boolean - disables form during submission
 * - onCancel?: () => void - optional cancel action
 *
 * PUBLIC_INTERFACE
 */
export default function ReservationForm({
  onSubmit,
  initialValues = {},
  submitting = false,
  onCancel,
}) {
  const [values, setValues] = useState(() => ({
    guestName: initialValues.guestName || "",
    phone: initialValues.phone || "",
    size: initialValues.size || 2,
    time: initialValues.time || defaultDateTimeLocal(),
    notes: initialValues.notes || "",
  }));
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const constraints = useMemo(
    () => ({
      nameMin: 2,
      nameMax: 80,
      sizeMin: 1,
      sizeMax: 20,
      notesMax: 240,
      // E.164-ish loose check or common local formats, non-strict to avoid rejecting valid numbers
      phonePattern: /^[+()\-.\s\d]{7,20}$/,
    }),
    []
  );

  const validate = (draft = values) => {
    const e = {};
    const name = String(draft.guestName || "").trim();
    if (!name) e.guestName = "Guest name is required";
    else if (name.length < constraints.nameMin)
      e.guestName = `Name must be at least ${constraints.nameMin} characters`;
    else if (name.length > constraints.nameMax)
      e.guestName = `Name cannot exceed ${constraints.nameMax} characters`;

    const phone = String(draft.phone || "").trim();
    if (phone && !constraints.phonePattern.test(phone)) {
      e.phone = "Enter a valid phone number";
    }

    const size = Number(draft.size);
    if (!Number.isFinite(size) || size < constraints.sizeMin) {
      e.size = `Party size must be at least ${constraints.sizeMin}`;
    } else if (size > constraints.sizeMax) {
      e.size = `Party size cannot exceed ${constraints.sizeMax}`;
    }

    const time = String(draft.time || "");
    if (!time) e.time = "Reservation date/time is required";
    else if (!isFutureOrNow(time)) e.time = "Time must be in the future";

    const notes = String(draft.notes || "");
    if (notes.length > constraints.notesMax) {
      e.notes = `Notes cannot exceed ${constraints.notesMax} characters`;
    }

    return e;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    const next = { ...values, [name]: name === "size" ? parseInt(value, 10) : value };
    setValues(next);
    if (touched[name]) {
      setErrors(validate(next));
    }
  };

  const onBlur = (e) => {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validate(values));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const eNow = validate(values);
    setErrors(eNow);
    setTouched({
      guestName: true,
      phone: true,
      size: true,
      time: true,
      notes: true,
    });
    if (Object.keys(eNow).length > 0) return;

    const payload = {
      guestName: values.guestName.trim(),
      phone: values.phone.trim() || undefined,
      size: Number(values.size),
      time: new Date(values.time).toISOString(),
      notes: values.notes.trim() || undefined,
    };

    try {
      await onSubmit?.(payload);
      // Clear form if it was a create form (no initialValues.id)
      if (!initialValues?.id) {
        setValues({
          guestName: "",
          phone: "",
          size: 2,
          time: defaultDateTimeLocal(),
          notes: "",
        });
        setTouched({});
        setErrors({});
      }
    } catch {
      // Surface a generic top-level error without exposing details/PII
      setErrors((prev) => ({
        ...prev,
        _form: "Unable to submit reservation right now. Please try again.",
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Reservation form">
      {errors._form && (
        <div role="alert" style={{ color: "var(--color-error)", marginBottom: 8 }}>
          {errors._form}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label htmlFor="guestName" style={labelStyle}>Guest name</label>
          <input
            id="guestName"
            name="guestName"
            type="text"
            value={values.guestName}
            onChange={onChange}
            onBlur={onBlur}
            required
            aria-invalid={!!errors.guestName}
            aria-describedby={errors.guestName ? "guestName-error" : undefined}
            style={inputStyle(!!errors.guestName)}
            placeholder="e.g., Jane Doe"
          />
          {errors.guestName && (
            <div id="guestName-error" style={errorTextStyle}>{errors.guestName}</div>
          )}
        </div>

        <div>
          <label htmlFor="phone" style={labelStyle}>Phone (optional)</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={values.phone}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            style={inputStyle(!!errors.phone)}
            placeholder="+1 (555) 123-4567"
          />
          {errors.phone && (
            <div id="phone-error" style={errorTextStyle}>{errors.phone}</div>
          )}
        </div>

        <div>
          <label htmlFor="size" style={labelStyle}>Party size</label>
          <input
            id="size"
            name="size"
            type="number"
            min="1"
            max="20"
            value={values.size}
            onChange={onChange}
            onBlur={onBlur}
            required
            aria-invalid={!!errors.size}
            aria-describedby={errors.size ? "size-error" : undefined}
            style={inputStyle(!!errors.size)}
          />
          {errors.size && (
            <div id="size-error" style={errorTextStyle}>{errors.size}</div>
          )}
        </div>

        <div>
          <label htmlFor="time" style={labelStyle}>Date & time</label>
          <input
            id="time"
            name="time"
            type="datetime-local"
            value={values.time}
            onChange={onChange}
            onBlur={onBlur}
            required
            aria-invalid={!!errors.time}
            aria-describedby={errors.time ? "time-error" : undefined}
            style={inputStyle(!!errors.time)}
          />
          {errors.time && (
            <div id="time-error" style={errorTextStyle}>{errors.time}</div>
          )}
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="notes" style={labelStyle}>Notes (optional)</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={values.notes}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={!!errors.notes}
            aria-describedby={errors.notes ? "notes-error" : undefined}
            style={{ ...inputStyle(!!errors.notes), resize: "vertical" }}
            placeholder="Allergies, occasion, seating preference..."
          />
          {errors.notes && (
            <div id="notes-error" style={errorTextStyle}>{errors.notes}</div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="submit"
          className="nav-link"
          disabled={submitting}
          aria-busy={submitting ? "true" : "false"}
        >
          {submitting ? "Submitting..." : initialValues?.id ? "Save changes" : "Create reservation"}
        </button>
        {typeof onCancel === "function" && (
          <button
            type="button"
            className="nav-link"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/** Helpers */
function defaultDateTimeLocal() {
  const now = new Date();
  // Round to next 15 minutes for convenience
  const ms = 1000 * 60 * 15;
  const rounded = new Date(Math.ceil(now.getTime() / ms) * ms);
  const pad = (n) => (n < 10 ? `0${n}` : String(n));
  const yyyy = rounded.getFullYear();
  const mm = pad(rounded.getMonth() + 1);
  const dd = pad(rounded.getDate());
  const hh = pad(rounded.getHours());
  const min = pad(rounded.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function isFutureOrNow(dtLocalStr) {
  const d = new Date(dtLocalStr);
  if (isNaN(d.getTime())) return false;
  return d.getTime() >= Date.now() - 60_000; // allow a small clock skew
}

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
};

const errorTextStyle = {
  color: "var(--color-error)",
  fontSize: 12,
  marginTop: 4,
};

function inputStyle(hasError) {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: `1px solid ${hasError ? "var(--color-error)" : "rgba(0,0,0,0.12)"}`,
    background: "var(--color-surface)",
    color: "var(--color-text)",
    outline: "none",
    boxShadow: "0 2px 8px rgba(31,41,55,0.05)",
  };
}
