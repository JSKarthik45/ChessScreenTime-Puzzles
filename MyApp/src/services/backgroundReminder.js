import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { scheduleAllWindowNotifications } from './notifications';

const TASK_NAME = 'noScrollReminderTask';

// Define once at module scope so it works when app is not open
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    // Re-schedule window notifications every time background task runs
    // This ensures they stay registered even if OS clears them
    await scheduleAllWindowNotifications();
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
