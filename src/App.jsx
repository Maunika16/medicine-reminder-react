import { useState, useEffect, useRef, useCallback } from "react";
import ReminderForm from "./components/ReminderForm";
import ReminderList from "./components/ReminderList";
import "./styles/App.css";

/* ══════════════════════════════════════════════════════════
   NOTIFICATION HOOK
   ══════════════════════════════════════════════════════════

   How it works:
   • new Notification() fires instantly from the main thread
     while the tab is open — no Service Worker dependency,
     no promises, no race conditions.
   • A setInterval checks every 30 s whether a reminder's
     HH:MM matches the current time (within a 60 s window).
   • On visibilitychange the SW takes over / steps back.
   • testAlarm() fires a real notification after 5 seconds.
*/
function useNotifications(reminders) {
  const [permission, setPermission] = useState(() =>
    "Notification" in window ? Notification.permission : "unsupported"
  );

  // Always-current reference so the interval never stales
  const remindersRef = useRef(reminders);
  useEffect(() => { remindersRef.current = reminders; }, [reminders]);

  /* ── Register Service Worker once ── */
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((r) => console.log("[MedRemind] SW registered", r.scope))
      .catch((e) => console.warn("[MedRemind] SW failed:", e));
  }, []);

  /* ── Fire a notification using new Notification() directly ──
     This is the CORRECT way to show a notification from the main
     thread. It works instantly the moment permission is granted —
     no SW activation race, no .ready promise needed.           */
  const fireNotification = useCallback((item) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      const n = new Notification(`💊 Time for ${item.medicine}`, {
        body:  item.dose ? `Dose: ${item.dose}` : "Tap to open MedRemind",
        tag:   `medremind-${item.id}`,
        renotify: true,
      });
      n.onclick = () => { window.focus(); n.close(); };
    } catch (e) {
      console.warn("[MedRemind] Notification error:", e);
    }
  }, []);

  /* ── Alarm poller (tab visible, every 30 s) ── */
  useEffect(() => {
    if (permission !== "granted") return;

    const fired = new Set(); // prevent double-firing in same session

    function checkAlarms() {
      if (document.hidden) return; // SW handles background
      const now     = Date.now();
      const current = remindersRef.current;

      current.forEach((item) => {
        if (!item.time)         return;
        if (fired.has(item.id)) return;

        // Build today's scheduled timestamp for this HH:MM
        const [h, m] = item.time.split(":").map(Number);
        const fireAt = new Date();
        fireAt.setHours(h, m, 0, 0);
        const ms = fireAt.getTime();

        // Fire if due within the last 60 s (covers 30 s poll gap)
        if (ms <= now && ms >= now - 60_000) {
          fired.add(item.id);
          fireNotification(item);
        }
      });
    }

    checkAlarms(); // immediate check
    const id = setInterval(checkAlarms, 30_000);
    return () => clearInterval(id);
  }, [permission, fireNotification]);

  /* ── Visibility handoff to SW ── */
  useEffect(() => {
    if (permission !== "granted") return;
    if (!("serviceWorker" in navigator)) return;

    const onVisibility = () => {
      navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage(
          document.hidden
            ? { type: "SCHEDULE_BACKGROUND", reminders: remindersRef.current }
            : { type: "CANCEL_BACKGROUND" }
        );
      }).catch(() => {});
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [permission]);

  /* ── Request permission ── */
  async function requestPermission() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      // Welcome notification — fires directly, no SW needed
      new Notification("🎉 MedRemind Alarms Enabled!", {
        body: "You'll be notified at the exact time each medicine is due.",
        tag:  "medremind-welcome",
      });
    }
  }

  /* ── Test alarm — plain setTimeout, fires in 5 s ── */
  function testAlarm() {
    if (permission !== "granted") { requestPermission(); return; }
    console.log("[MedRemind] Test alarm fires in 5 s…");
    setTimeout(() => {
      fireNotification({
        id:       "test-" + Date.now(),
        medicine: "Test Medicine",
        dose:     "1 tablet — alarms are working! 🎉",
        time:     new Date().toTimeString().slice(0, 5),
      });
    }, 5000);
  }

  return { permission, requestPermission, testAlarm };
}

/* ══════════════════════════════════════════════════════════
   NOTIFICATION BANNER
   Small banner rendered just above the form card.
   Styled entirely with inline styles so it doesn't require
   any changes to App.css or index.css.
   ══════════════════════════════════════════════════════════ */
function NotifBanner({ permission, onRequest, onTest }) {
  const base = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    flexWrap: "wrap", gap: "10px",
    padding: "12px 18px", borderRadius: "14px", marginBottom: "16px",
    fontSize: "0.82rem", fontWeight: 500, lineHeight: 1.5,
    fontFamily: "var(--font-body)",
  };
  const btn = (bg, color, border) => ({
    flexShrink: 0, padding: "6px 14px",
    background: bg, border: `1px solid ${border}`,
    borderRadius: "8px", color,
    fontFamily: "var(--font-display)", fontSize: "0.75rem",
    fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
  });

  if (permission === "granted") return (
    <div style={{ ...base, background: "rgba(200,244,99,0.07)", border: "1px solid rgba(200,244,99,0.18)", color: "#c8f463" }}>
      <span>🔔 Alarms active — you'll be notified at each medicine's scheduled time.</span>
      <button onClick={onTest} style={btn("rgba(200,244,99,0.12)", "#c8f463", "rgba(200,244,99,0.3)")}>
        ⏱ Test in 5 s
      </button>
    </div>
  );

  if (permission === "denied") return (
    <div style={{ ...base, background: "rgba(255,95,109,0.07)", border: "1px solid rgba(255,95,109,0.2)", color: "#ff5f6d" }}>
      <span>🚫 Notifications blocked. Enable them in browser settings then reload.</span>
    </div>
  );

  if (permission === "unsupported") return (
    <div style={{ ...base, background: "rgba(255,200,60,0.07)", border: "1px solid rgba(255,200,60,0.18)", color: "#ffc83c" }}>
      <span>⚠️ This browser doesn't support notifications. Try Chrome or Edge.</span>
    </div>
  );

  // "default" — not yet asked
  return (
    <div style={{ ...base, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}>
      <span>🔔 Enable notifications to get an alarm at each medicine's scheduled time.</span>
      <button onClick={onRequest} style={btn("rgba(200,244,99,0.12)", "#c8f463", "rgba(200,244,99,0.3)")}>
        Enable Alarms
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   APP  — original code preserved exactly, only additions made
   ══════════════════════════════════════════════════════════ */
function App() {
  // ── original state ──────────────────────────────────────
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
  // ── end original state ───────────────────────────────────

  // ── notification hook (new) ──────────────────────────────
  const { permission, requestPermission, testAlarm } = useNotifications(reminders);
  // ────────────────────────────────────────────────────────

  return (
    <div className="app-container">
      {/* ── original header — unchanged ── */}
      <header className="app-header">
        <div className="badge">
          <span>💊</span> Daily Health
        </div>
        <h1>
          Med<span>Remind</span>
        </h1>
        <p>Never miss a dose. Add your medicines below and stay on track with your health routine.</p>
      </header>

      {/* ── notification banner (new) — sits above the form card ── */}
      <NotifBanner
        permission={permission}
        onRequest={requestPermission}
        onTest={testAlarm}
      />

      {/* ── original form card — unchanged ── */}
      <div className="card form-card">
        <ReminderForm addReminder={addReminder} />
      </div>

      {/* ── original divider — unchanged ── */}
      <div className="divider">
        <span>Your Reminders</span>
      </div>

      {/* ── original list — unchanged ── */}
      <ReminderList reminders={reminders} deleteReminder={deleteReminder} />
    </div>
  );
}

export default App;