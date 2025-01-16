import { startExercise, stopExercise, getExerciseState } from './exerciseManager.js';
import { scheduleReminderAtTime } from './notifications.js';

// Cached mute state
let isMuted = false;

// Listener for messages from popup.js or exerciseManager.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.command) {
    case 'startExercise':
      startExercise(message.settings);
      sendResponse({ status: 'Exercise started' });
      break;

    case 'stopExercise':
      stopExercise();
      sendResponse({ status: 'Exercise stopped' });
      break;

    case 'checkExerciseStatus':
      sendResponse({ isActive: getExerciseState().isActive });
      break;

    case 'updateReminders':
      checkAndScheduleReminders();
      sendResponse({ status: 'Reminders updated' });
      break;

    case 'toggleMute':
      toggleMuteState(message.isMuted);
      sendResponse({ status: 'Mute state updated' });
      break;

    case 'getMuteState':
      sendResponse({ isMuted });
      break;

    case 'updateProgress':
      chrome.runtime.sendMessage(message); // Forward `updateProgress` to popup.js
      break;

    default:
      console.warn(`Unknown command received: ${message.command}`);
  }
  return true; // Keep the messaging channel open for async responses
});

// Initialize alarms when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.clearAll(() => {
    chrome.alarms.create('reminderHeartbeat', { periodInMinutes: 1 });
  });
});

/**
 * Toggles the mute state in chrome.storage and updates cached value.
 * @param {boolean} newMuteState - The new mute state.
 */
function toggleMuteState(newMuteState) {
  isMuted = newMuteState; // Update cached state
  chrome.storage.local.set({ isMuted: newMuteState }, () => {
    // Notify offscreen.js about the mute state change
    chrome.runtime.sendMessage({ command: 'updateMuteState', isMuted: newMuteState });
  });
}

/**
 * Schedules or re-schedules reminders based on user settings.
 */
function checkAndScheduleReminders() {
  chrome.storage.sync.get(['reminderTime', 'reminderEnabled', 'reminderRepeatInterval'], (result) => {
    chrome.alarms.clear('dailyKegelReminder');
    chrome.alarms.clear('kegelReminderRepeat');

    if (result.reminderEnabled && result.reminderTime) {
      scheduleReminderAtTime(result.reminderTime, result.reminderRepeatInterval);
    }
  });
}

// Alarm listener to re-schedule reminders periodically
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'reminderHeartbeat') {
    checkAndScheduleReminders();
  }
});
