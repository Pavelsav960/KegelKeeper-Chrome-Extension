// popup-eventListeners.js

/**
 * This file is responsible for attaching all event listeners for user interactions
 * within the popup interface of the Chrome extension. It includes listeners for buttons,
 * switches, and other input elements to handle user actions effectively.
 */

import { handleStart, handleStop, getExerciseSettings, saveExerciseSettings } from './popup.js';
import { saveReminderSettings, toggleReminders } from '../reminderSettings.js';
import { applyTheme } from './popup-theme.js';

/** Attaches all event listeners for the popup interface. */
export function attachEventListeners() {
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const muteSwitch = document.getElementById('muteSwitch');
  const themeSwitch = document.getElementById('themeSwitch');
  const reminderTimeInput = document.getElementById('reminderTime');
  const reminderRepeatIntervalInput = document.getElementById('reminderRepeatInterval');
  const enableRemindersCheckbox = document.getElementById('enableReminders');

  // Start and stop button listeners
  startButton.addEventListener('click', handleStart);
  stopButton.addEventListener('click', handleStop);

  // Save exercise settings
  document.getElementById('saveSettings').addEventListener('click', saveExerciseSettings);

  // Save and toggle reminder settings
  document.getElementById('saveReminderTime').addEventListener('click', () => {
    saveReminderSettings(reminderTimeInput, reminderRepeatIntervalInput, enableRemindersCheckbox, (message) => {
      console.log(message);
    });
  });

  enableRemindersCheckbox.addEventListener('change', () => {
    toggleReminders(enableRemindersCheckbox, (message) => {
      console.log(message);
    });
  });

  // Mute switch listener
  muteSwitch.addEventListener('change', () => {
    const isMuted = muteSwitch.checked;
    chrome.runtime.sendMessage({ command: 'toggleMute', isMuted });
    chrome.storage.local.set({ isMuted });
  });

  // Theme switch listener
  themeSwitch.addEventListener('change', () => {
    const selectedTheme = themeSwitch.checked ? 'dark' : 'light';
    applyTheme(selectedTheme);
  });
}
