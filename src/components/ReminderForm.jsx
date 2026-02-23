import { useState } from "react";

function ReminderForm({ addReminder }) {
  const [medicine, setMedicine] = useState("");
  const [time, setTime] = useState("");
  const [dose, setDose] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!medicine.trim()) {
      setError("Please enter a medicine name.");
      return;
    }
    if (!time) {
      setError("Please select a reminder time.");
      return;
    }

    const newReminder = {
      id: crypto.randomUUID(),
      medicine: medicine.trim(),
      dose: dose.trim() || null,
      time,
      createdAt: new Date().toISOString(),
    };

    addReminder(newReminder);
    setMedicine("");
    setTime("");
    setDose("");
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label className="form-label" htmlFor="medicine">
          Medicine Name
        </label>
        <input
          id="medicine"
          type="text"
          className="form-input"
          placeholder="e.g. Metformin, Vitamin D..."
          value={medicine}
          onChange={(e) => setMedicine(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="dose">
            Dosage (optional)
          </label>
          <input
            id="dose"
            type="text"
            className="form-input"
            placeholder="e.g. 500mg, 1 tablet"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="time">
            Reminder Time
          </label>
          <input
            id="time"
            type="time"
            className="form-input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p style={{ color: "var(--red)", fontSize: "0.82rem", marginTop: "12px" }}>
          ⚠ {error}
        </p>
      )}

      <button type="submit" className="btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        Add Reminder
      </button>
    </form>
  );
}

export default ReminderForm;