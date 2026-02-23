import { useState, useEffect } from "react";
import ReminderForm from "./components/ReminderForm";
import ReminderList from "./components/ReminderList";
import "./styles/App.css";

function App() {
  const [reminders, setReminders] = useState(() => {
    try {
      const saved = localStorage.getItem("med-reminders");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("med-reminders", JSON.stringify(reminders));
  }, [reminders]);

  const addReminder = (reminder) => {
    setReminders((prev) => [reminder, ...prev]);
  };

  const deleteReminder = (id) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="badge">
          <span>💊</span> Daily Health
        </div>
        <h1>
          Med<span>Remind</span>
        </h1>
        <p>Never miss a dose. Add your medicines below and stay on track with your health routine.</p>
      </header>

      <div className="card form-card">
        <ReminderForm addReminder={addReminder} />
      </div>

      <div className="divider">
        <span>Your Reminders</span>
      </div>

      <ReminderList reminders={reminders} deleteReminder={deleteReminder} />
    </div>
  );
}

export default App;