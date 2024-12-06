// Default settings constant
const DEFAULT_SETTINGS = {
  holdTime: 5,  // seconds
  releaseTime: 5,  // seconds
  cycles: 10,  // number of repetitions
};

// Save settings to Chrome storage
function saveSettings(settings) {
  chrome.storage.sync.set({ kegelSettings: settings }, () => {
    console.log('Settings saved:', settings);
  });
}

// Load settings with optional callback for handling
function loadSettings(callback = (settings) => console.log('Loaded settings:', settings)) {
  chrome.storage.sync.get(['kegelSettings'], (result) => {
    const settings = result.kegelSettings || DEFAULT_SETTINGS;
    callback(settings);
  });
}

// Reset settings to default
function resetSettings() {
  saveSettings(DEFAULT_SETTINGS);
}

export { saveSettings, loadSettings, resetSettings };
