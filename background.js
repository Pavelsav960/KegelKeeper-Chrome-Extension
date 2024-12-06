import { startExercise, stopExercise, getExerciseState } from './js/exerciseManager.js';
import { scheduleReminderAtTime } from './js/notifications.js';

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
      chrome.storage.local.get('isMuted', (data) => {
        sendResponse({ isMuted: data.isMuted || false });
      });
      return true;

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
 * Toggles the mute state in chrome.storage.
 * @param {boolean} isMuted - The new mute state.
 */
function toggleMuteState(isMuted) {
  chrome.storage.local.set({ isMuted }, () => {
    chrome.runtime.sendMessage({ command: 'updateMuteState', isMuted });
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
