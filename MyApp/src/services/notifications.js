import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { loadPreferences, getPuzzleCounts } from '../storage/preferences';

// Configure how notifications are handled when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission() {
  const settings = await Notifications.getPermissionsAsync();
  let status = settings.status;

  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }

  // Android: create a channel for notifications (required on Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return status === 'granted';
}

// --- Time helpers ---

function parseHHMM(s) {
  if (!s || typeof s !== 'string') return null;
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  let h = Number(m[1]);
  let min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  h = Math.max(0, Math.min(23, h));
  min = Math.max(0, Math.min(59, min));
  return { h, min };
}

function minutesSinceMidnight(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

function toMinutes(t) {
  return t ? t.h * 60 + t.min : null;
}

// Handles windows that may cross midnight
function isNowInWindow(fromStr, toStr, now = new Date()) {
  const from = parseHHMM(fromStr);
  const to = parseHHMM(toStr);
  if (!from || !to) return false;
  const f = toMinutes(from);
  const t = toMinutes(to);
  const cur = minutesSinceMidnight(now);
  if (f === null || t === null) return false;
  if (f <= t) {
    return cur >= f && cur <= t;
  } else {
    return cur >= f || cur <= t;
  }
}

export async function shouldSendReminder() {
  const prefs = await loadPreferences();
  const { problemTarget = 5, fromTime, toTime } = prefs;
  if (!isNowInWindow(fromTime, toTime)) return false;

  const counts = await getPuzzleCounts();
  const today = new Date().toISOString().substring(0, 10);
  const solved = counts[today] || 0;
  return solved < (Number(problemTarget) || 5);
}

// --- Main scheduling function: schedules daily repeating notifications ---
// Call this on EVERY app launch and whenever settings change.
// It cancels all existing scheduled notifications and creates fresh ones.

const REMINDER_INTERVAL_MIN = 45; // minutes between reminders during the window
const MAX_REMINDERS = 6; // cap to avoid notification spam

const REMINDER_MESSAGES = [
  { title: 'No-scroll time!', body: 'Time to solve puzzles instead of scrolling.' },
  { title: 'Still scrolling?', body: 'Open ChessST and solve your daily puzzles.' },
  { title: 'Keep going!', body: 'Finish your daily chess puzzles.' },
  { title: 'Puzzle time!', body: 'Put down the feed and pick up a puzzle.' },
  { title: 'Almost there!', body: 'A few more puzzles to hit your daily goal.' },
  { title: 'Last reminder!', body: "Don't let today pass without solving puzzles." },
];

export async function scheduleAllWindowNotifications() {
  const ok = await ensureNotificationPermission();
  if (!ok) return;

  // Always cancel all previously scheduled notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  const prefs = await loadPreferences();
  const { fromTime, toTime, problemTarget = 5 } = prefs;

  const from = parseHHMM(fromTime);
  const to = parseHHMM(toTime);
  if (!from || !to) return;

  let fromMin = from.h * 60 + from.min;
  let toMin = to.h * 60 + to.min;
  // Handle midnight crossing (e.g., 22:00 -> 06:00)
  if (toMin <= fromMin) toMin += 24 * 60;

  // Build time slots: window start + every REMINDER_INTERVAL_MIN
  const slots = [];
  for (let m = fromMin; m <= toMin && slots.length < MAX_REMINDERS; m += REMINDER_INTERVAL_MIN) {
    const normalized = m % (24 * 60);
    slots.push({ h: Math.floor(normalized / 60), min: normalized % 60 });
  }

  // Schedule each as a daily repeating notification (fires every day at exact time)
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const msg = REMINDER_MESSAGES[i % REMINDER_MESSAGES.length];
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: msg.body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: slot.h,
          minute: slot.min,
        },
      });
    } catch {}
  }
}

// Legacy alias (kept for backward compatibility)
export const scheduleDailyNoScrollNotification = scheduleAllWindowNotifications;

// --- Foreground interval reminders (bonus: only fire when app is open) ---

let reminderIntervalHandle = null;

export function startNoScrollReminder(intervalMs = 2 * 60 * 1000) {
  if (reminderIntervalHandle) return;
  reminderIntervalHandle = setInterval(async () => {
    try {
      const send = await shouldSendReminder();
      if (send) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Keep going!',
            body: 'Finish your daily puzzle goal.',
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null, // immediate
        });
      }
    } catch {}
  }, intervalMs);
}

export function stopNoScrollReminder() {
  if (reminderIntervalHandle) {
    clearInterval(reminderIntervalHandle);
    reminderIntervalHandle = null;
  }
}

// Cancel all notifications (e.g., when daily goal is reached)
export async function cancelAllReminders() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}
