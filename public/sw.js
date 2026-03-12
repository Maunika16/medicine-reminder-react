// ============================================================
//  MedRemind — sw.js   (place in /public/sw.js)
//
//  The React app fires notifications itself while the tab is
//  open (using new Notification() directly — instant, no SW
//  dependency needed). This SW only handles:
//    1. Background alarms when the tab is hidden / closed
//    2. Notification click → open / focus the app
// ============================================================

self.addEventListener("install",  ()  => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

let bgAlarms  = [];
let bgTimerId = null;

/* ══════════════════════════════════════════════════════════
   MESSAGES FROM APP
   ══════════════════════════════════════════════════════════ */
self.addEventListener("message", (event) => {
  const { type } = event.data || {};

  if (type === "SCHEDULE_BACKGROUND") {
    const now = Date.now();
    bgAlarms = (event.data.reminders || [])
      .filter((r) => r.time)
      .map((r) => {
        const [h, m] = r.time.split(":").map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return { fireAt: d.getTime(), item: r };
      })
      .filter((a) => a.fireAt > now);

    if (bgAlarms.length > 0) startBgTimer(event);
  }

  if (type === "CANCEL_BACKGROUND") {
    bgAlarms = [];
    if (bgTimerId) { clearInterval(bgTimerId); bgTimerId = null; }
  }
});

function startBgTimer(event) {
  if (bgTimerId) { clearInterval(bgTimerId); bgTimerId = null; }
  const done = new Promise((resolve) => {
    bgTimerId = setInterval(() => {
      const now = Date.now();
      bgAlarms = bgAlarms.filter((alarm) => {
        if (alarm.fireAt <= now) { showNotification(alarm.item); return false; }
        return true;
      });
      if (bgAlarms.length === 0) { clearInterval(bgTimerId); bgTimerId = null; resolve(); }
    }, 30_000);
  });
  event.waitUntil(done);
}

function showNotification(item) {
  return self.registration.showNotification(`💊 Time for ${item.medicine}`, {
    body:               item.dose ? `Dose: ${item.dose}` : "Tap to open MedRemind",
    tag:                `medremind-${item.id}`,
    renotify:           true,
    requireInteraction: true,
    data:               { item },
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow("/");
    })
  );
});