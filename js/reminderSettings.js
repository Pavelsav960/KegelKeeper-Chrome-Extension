// reminderSettings.js

// Load reminder settings from chrome.storage and update the UI inputs
export function loadReminderSettings(reminderTimeInput, reminderRepeatIntervalInput, enableRemindersCheckbox) {
  chrome.storage.sync.get(['reminderTime', 'reminderEnabled', 'reminderRepeatInterval'], (result) => {
    if (result.reminderTime) reminderTimeInput.value = result.reminderTime;
    if (result.reminderRepeatInterval) reminderRepeatIntervalInput.value = result.reminderRepeatInterval;
    enableRemindersCheckbox.checked = result.reminderEnabled || false;
  });
}

// Save reminder settings to chrome.storage and optionally update status
export function saveReminderSettings(reminderTimeInput, reminderRepeatIntervalInput, enableRemindersCheckbox, updateStatus) {
  const reminderTime = reminderTimeInput.value;
  const reminderRepeatInterval = parseInt(reminderRepeatIntervalInput.value) || 0;
  const reminderEnabled = enableRemindersCheckbox.checked;

   // Clear interval alarm (teporary solution)
   chrome.alarms.clear('kegelReminderRepeat', () => {
    console.log('kegelReminderRepeat alarm cleared.');
  });

  chrome.storage.sync.set({ reminderTime, reminderRepeatInterval, reminderEnabled }, () => {
    chrome.runtime.sendMessage({ command: 'updateReminders' });  // Notify background to schedule alarms
    if (updateStatus) {
      updateStatus(reminderEnabled ? 'Reminders saved and enabled.' : 'Reminders disabled.');
    }
    console.log(reminderEnabled ? 'Reminders saved and enabled.' : 'Reminders disabled.');
  });
}

// Toggle reminders and optionally update status
export function toggleReminders(enableRemindersCheckbox, updateStatus) {
  const reminderEnabled = enableRemindersCheckbox.checked;
  chrome.storage.sync.set({ reminderEnabled }, () => {
    chrome.runtime.sendMessage({ command: 'updateReminders' });  // Notify background to update reminders
    if (updateStatus) {
      updateStatus(reminderEnabled ? 'Reminders enabled.' : 'Reminders disabled.');
    }
    console.log(reminderEnabled ? 'Reminders enabled.' : 'Reminders disabled.');
  });
}
