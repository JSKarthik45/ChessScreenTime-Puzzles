import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as BackgroundTask from 'expo-background-task';
import { ensureNotificationPermission, shouldSendReminder, scheduleAllWindowNotifications } from './notifications';

const TASK_NAME = 'noScrollReminderTask';

// Define once at module scope so it works when app is not open
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    // Re-schedule window notifications every time background task runs
    // This ensures they stay registered even if OS clears them
    await scheduleAllWindowNotifications();

    const ok = await ensureNotificationPermission();
    if (ok && (await shouldSendReminder())) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Don\'t scroll!',
          body: 'Solve some puzzles instead of scrolling.',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    }
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundReminder(minMinutes = 15) {
  try {
    await BackgroundTask.registerTaskAsync(TASK_NAME, {
      minimumInterval: Math.max(15, minMinutes),
    });
    return true;
  } catch {
    return false;
  }
}
