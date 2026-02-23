// Formats "14:30" → "2:30 PM"
function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

// Pick a pill emoji variant based on medicine name for some fun variety
function getMedicineIcon(name) {
  const icons = ["💊", "🔵", "🟢", "🟡", "🔴", "⚪"];
  let hash = 0;
  for (const ch of name) hash += ch.charCodeAt(0);
  return icons[hash % icons.length];
}

function ReminderList({ reminders, deleteReminder }) {
  if (reminders.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🗓</span>
        <strong>No reminders yet</strong>
        <p>Add your first medicine above to get started with your daily health routine.</p>
      </div>
    );
  }

  // Sort by time ascending
  const sorted = [...reminders].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div>
      <p className="reminder-count">
        <strong>{reminders.length}</strong> active reminder{reminders.length !== 1 ? "s" : ""}
      </p>

      {sorted.map((item) => (
        <div className="reminder-item" key={item.id}>
          <div className="reminder-icon" title={item.medicine}>
            {getMedicineIcon(item.medicine)}
          </div>

          <div className="reminder-info">
            <div className="reminder-name">{item.medicine}</div>
            <div className="reminder-time">
              <span className="dot" />
              {formatTime(item.time)}
              {item.dose && (
                <>
                  &ensp;·&ensp;<span style={{ opacity: 0.7 }}>{item.dose}</span>
                </>
              )}
            </div>
          </div>

          <button
            className="btn-delete"
            onClick={() => deleteReminder(item.id)}
            aria-label={`Delete reminder for ${item.medicine}`}
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

export default ReminderList;