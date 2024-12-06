import { saveSettings, loadSettings } from './exerciseSettings.js';
import { loadReminderSettings, saveReminderSettings, toggleReminders } from './reminderSettings.js';

// DOM element references
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const status = document.getElementById('status');
const holdTimeInput = document.getElementById('holdTime');
const releaseTimeInput = document.getElementById('releaseTime');
const cyclesInput = document.getElementById('cycles');
const reminderTimeInput = document.getElementById('reminderTime');
const reminderRepeatIntervalInput = document.getElementById('reminderRepeatInterval');
const enableRemindersCheckbox = document.getElementById('enableReminders');
const exerciseProgress = document.getElementById('exerciseProgress');
const progressText = document.getElementById('progressText'); // Text inside the circular bar
const progressCircle = document.querySelector('.progress-ring__circle'); // Circular progress bar
const muteSwitch = document.getElementById('muteSwitch');

// Constants for the circular progress bar
const RADIUS = 90; // Updated radius
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

let circularProgressInterval;

// Initialize circular progress bar properties
progressCircle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
progressCircle.style.strokeDashoffset = CIRCUMFERENCE;

// Initialize settings and event listeners
document.addEventListener('DOMContentLoaded', () => {
  initializeSettings();
  loadReminderSettings(reminderTimeInput, reminderRepeatIntervalInput, enableRemindersCheckbox);
  attachEventListeners();

  exerciseProgress.textContent = "Ready to start your exercise!";
  
  chrome.storage.local.get('isMuted', (data) => {
    muteSwitch.checked = data.isMuted || false;
  });

  chrome.runtime.sendMessage({ command: 'checkExerciseStatus' }, (response) => {
    if (response?.isActive) {
      updateStatus('Exercise ongoing...');
      updateProgressDisplay(response.currentCycle, response.totalCycles);
      toggleStartStopButtons(true);
    } else {
      toggleStartStopButtons(false);
    }
  });
});

// Function to start circular progress animation
function startCircularProgress(duration) {
  clearInterval(circularProgressInterval); // Clear any ongoing animation

  const startTime = Date.now();
  const endTime = startTime + duration;

  circularProgressInterval = setInterval(() => {
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = elapsed / duration; // Calculate progress

    // Clamp progress to [0, 1] to avoid overshooting
    const clampedProgress = Math.min(progress, 1);

    // Update circular progress visually
    const offset = CIRCUMFERENCE * (1 - clampedProgress);
    progressCircle.style.strokeDashoffset = offset;

    // Log current progress and offset
    console.log(`Elapsed: ${elapsed}, Progress: ${clampedProgress}, Offset: ${offset}`);

    // Update the percentage text inside the circle
    progressText.textContent = `${Math.round(clampedProgress * 100)}%`;

    // Stop the interval when complete
    if (clampedProgress === 1) {
      clearInterval(circularProgressInterval);
      progressCircle.style.strokeDashoffset = 0; // Forcefully set to 0
      progressText.textContent = '100%'; // Ensure final text is correct
      console.log("Final strokeDashoffset:", progressCircle.style.strokeDashoffset);
    }
  }, 16); // High update rate (60FPS for smoothness)
}





// Reset the circular progress bar
function resetCircularProgress() {
  clearInterval(circularProgressInterval);
  progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
  progressText.textContent = 'Ready';
}

// Update the text inside the circular progress bar
function updateCircularProgressText(text) {
  progressText.textContent = text;
}

// Load initial exercise settings
function initializeSettings() {
  loadSettings((settings) => {
    holdTimeInput.value = settings.holdTime;
    releaseTimeInput.value = settings.releaseTime;
    cyclesInput.value = settings.cycles;
  });
}

// Attach event listeners for user interactions
function attachEventListeners() {
  startButton.addEventListener('click', handleStart);
  stopButton.addEventListener('click', handleStop);
  document.getElementById('saveSettings').addEventListener('click', saveExerciseSettings);
  document.getElementById('resetSettings').addEventListener('click', resetExerciseSettings);

  document.getElementById('saveReminderTime').addEventListener('click', () => {
    saveReminderSettings(reminderTimeInput, reminderRepeatIntervalInput, enableRemindersCheckbox, updateStatus);
  });
  enableRemindersCheckbox.addEventListener('change', () => {
    toggleReminders(enableRemindersCheckbox, updateStatus);
  });

  muteSwitch.addEventListener('change', () => {
    const isMuted = muteSwitch.checked;
    chrome.runtime.sendMessage({ command: 'toggleMute', isMuted });
    chrome.storage.local.set({ isMuted });
  });
}

// Send start command to background script
function handleStart() {
  const settings = getExerciseSettings();
  chrome.runtime.sendMessage({ command: 'startExercise', settings }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("Error:", chrome.runtime.lastError.message);
      updateStatus('Failed to start exercise');
    } else {
      updateStatus(response?.status || 'Exercise started');
      toggleStartStopButtons(true);
      updateProgressDisplay(1, settings.cycles);
    }
  });
}

// Send stop command to background script
function handleStop() {
  chrome.runtime.sendMessage({ command: 'stopExercise' }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("Error:", chrome.runtime.lastError.message);
      updateStatus('Failed to stop exercise');
    } else {
      updateStatus('Exercise stopped');
      exerciseProgress.textContent = `Cycle 0 of ${cyclesInput.value}`;
      resetCircularProgress(); // Reset circular bar on stop
      toggleStartStopButtons(false);
    }
  });
}

// Retrieve current exercise settings from inputs
function getExerciseSettings() {
  return {
    holdTime: parseInt(holdTimeInput.value),
    releaseTime: parseInt(releaseTimeInput.value),
    cycles: parseInt(cyclesInput.value),
  };
}

// Update the status text
function updateStatus(message) {
  console.log("Status:", message);
  status.textContent = message;
}

// Update progress display
function updateProgressDisplay(currentCycle, totalCycles) {
  exerciseProgress.textContent = `Cycle ${currentCycle} of ${totalCycles}`;
}

// Enable or disable start/stop buttons
function toggleStartStopButtons(isRunning) {
  startButton.disabled = isRunning;
  stopButton.disabled = !isRunning;
}

// Handle end of an exercise session
function handleExerciseComplete(totalCycles) {
  updateStatus('Exercise complete!');
  exerciseProgress.textContent = `Congratulations! You completed all ${totalCycles} cycles.`;
  resetCircularProgress();
  toggleStartStopButtons(false);
}

// Save exercise settings
function saveExerciseSettings() {
  saveSettings(getExerciseSettings());
  updateStatus('Settings saved!');
}

// Reset exercise settings to defaults
function resetExerciseSettings() {
  const defaultSettings = { holdTime: 5, releaseTime: 5, cycles: 10 };
  saveSettings(defaultSettings);
  holdTimeInput.value = defaultSettings.holdTime;
  releaseTimeInput.value = defaultSettings.releaseTime;
  cyclesInput.value = defaultSettings.cycles;
  updateStatus('Settings reset to default!');
}

// Handle messages from background.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.command === 'updatePhase') {
    updateStatus(`Exercise phase: ${message.phase}`);
    if (message.phase === 'hold') {
      startCircularProgress(parseInt(holdTimeInput.value) * 1000);
    } else if (message.phase === 'release') {
      resetCircularProgress();
    }
  } else if (message.command === 'exerciseStopped') {
    if (message.wasCompletedNaturally) {
      handleExerciseComplete(cyclesInput.value);
    } else {
      updateStatus('Exercise stopped');
      exerciseProgress.textContent = `Cycle 0 of ${cyclesInput.value}`;
      resetCircularProgress();
    }
  } else if (message.command === 'updateProgress') {
    updateProgressDisplay(message.currentCycle, message.totalCycles);
    updateCircularProgressText(`Cycle ${message.currentCycle}/${message.totalCycles}`);
  }
});
