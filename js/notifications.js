// Schedule an alarm for a specific time of day and repeat interval
function scheduleReminderAtTime(reminderTime, repeatInterval = 0) {
  try {
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }

    const timeUntilReminder = reminderDate.getTime() - now.getTime();

    chrome.alarms.getAll((alarms) => {
      const alarmNames = alarms.map(alarm => alarm.name);

      if (!alarmNames.includes('dailyKegelReminder')) {
        chrome.alarms.create('dailyKegelReminder', { when: Date.now() + timeUntilReminder });
        console.log("Scheduled dailyKegelReminder for", reminderDate);
      }

      if (repeatInterval > 0 && !alarmNames.includes('kegelReminderRepeat')) {
        chrome.alarms.create('kegelReminderRepeat', { periodInMinutes: repeatInterval });
        console.log(`Scheduled kegelReminderRepeat every ${repeatInterval} minutes.`);
      }
    });
  } catch (error) {
    console.error("Error in scheduleReminderAtTime:", error);
  }
}


// Listen for alarms and trigger notifications
chrome.alarms.onAlarm.addListener((alarm) => {
  try {
    chrome.storage.sync.get('reminderEnabled', (result) => {
      if (result.reminderEnabled && (alarm.name === 'dailyKegelReminder' || alarm.name === 'kegelReminderRepeat')) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'KegelKeeper Reminder',
          message: 'Time for your Kegel exercise session! Stay consistent for better results.'
        }, (notificationId) => {
          if (chrome.runtime.lastError) {
            console.error("Notification error:", chrome.runtime.lastError.message);
          }
        });

        // Reschedule the daily reminder for the next day if needed
        if (alarm.name === 'dailyKegelReminder') {
          chrome.storage.sync.get('reminderTime', (result) => {
            if (result.reminderTime) {
              scheduleReminderAtTime(result.reminderTime);
            }
          });
        }
      }
    });
  } catch (error) {
    console.error("Error in alarm listener:", error);
  }
});


export { scheduleReminderAtTime };
