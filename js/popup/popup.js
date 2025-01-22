import { saveSettings, loadSettings } from '../exerciseSettings.js';
import { loadReminderSettings, saveReminderSettings, toggleReminders } from '../reminderSettings.js';
import { updateStatus, updateProgressDisplay, toggleStartStopButtons, displayProgressData } from './popup-ui.js';
// import { startCountdown } from './popup-ui.js'; // Import the function
import { attachEventListeners } from './popup-eventListeners.js';
import {
  initializeCircularProgress,
  startCircularProgress,
  resetCircularProgress,
} from './popup-progress.js';
import { populateExercisePlansDropdown, getPlanSettings } from '../exercisePlans.js';


// DOM element references
const holdTimeInput = document.getElementById('holdTime');
const releaseTimeInput = document.getElementById('releaseTime');
const cyclesInput = document.getElementById('cycles');
const reminderTimeInput = document.getElementById('reminderTime');
const reminderRepeatIntervalInput = document.getElementById('reminderRepeatInterval');
const enableRemindersCheckbox = document.getElementById('enableReminders');
const exerciseProgress = document.getElementById('exerciseProgress');
const progressCircle = document.querySelector('.progress-ring__circle'); // Circular progress bar
const muteSwitch = document.getElementById('muteSwitch');
const themeSwitch = document.getElementById('themeSwitch'); // Theme toggle element
const exercisePlanDropdown = document.getElementById('exercisePlan');


// Constants for the circular progress bar
const RADIUS = 90; // Updated radius
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

progressCircle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
progressCircle.style.strokeDashoffset = CIRCUMFERENCE;

// Initialize settings and event listeners
// Initialize settings and event listeners
document.addEventListener('DOMContentLoaded', () => {
  initializeSettings();
  loadReminderSettings(reminderTimeInput, reminderRepeatIntervalInput, enableRemindersCheckbox);
  attachEventListeners();
  initializeCircularProgress(progressCircle);

  // Populate the exercise plans dropdown
  populateExercisePlansDropdown(exercisePlanDropdown);

  // Restore the selected plan and apply its settings
  chrome.storage.local.get('selectedPlan', (data) => {
    const savedPlan = data.selectedPlan || 'beginner'; // Default to beginner
    exercisePlanDropdown.value = savedPlan;

    const selectedPlanSettings = getPlanSettings(savedPlan);
    if (selectedPlanSettings) {
      holdTimeInput.value = selectedPlanSettings.holdTime;
      releaseTimeInput.value = selectedPlanSettings.releaseTime;
      cyclesInput.value = selectedPlanSettings.cycles;
    }
  });

  exercisePlanDropdown.addEventListener('change', () => {
    const selectedPlanSettings = getPlanSettings(exercisePlanDropdown.value);
    if (selectedPlanSettings) {
      holdTimeInput.value = selectedPlanSettings.holdTime;
      releaseTimeInput.value = selectedPlanSettings.releaseTime;
      cyclesInput.value = selectedPlanSettings.cycles;

      chrome.storage.local.set({ selectedPlan: exercisePlanDropdown.value });
    }
  });

  exerciseProgress.textContent = ".....";

  chrome.storage.local.get('isMuted', (data) => {
    muteSwitch.checked = data.isMuted || false;
  });

  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.classList.add(savedTheme);
  themeSwitch.checked = savedTheme === 'dark';

  chrome.runtime.sendMessage({ command: 'checkExerciseStatus' }, (response) => {
    if (response?.isActive) {
      updateStatus('Exercise ongoing...');
      updateProgressDisplay(response.currentCycle, response.totalCycles);
      toggleStartStopButtons(true);
    } else {
      toggleStartStopButtons(false);
    }
  });

  // Pass exercise settings to displayProgressData
  loadSettings((settings) => {
    const { holdTime, releaseTime, cycles } = settings;
    displayProgressData(holdTime, releaseTime, cycles);
  });
});




// Load initial exercise settings
function initializeSettings() {
  loadSettings((settings) => {
    holdTimeInput.value = settings.holdTime;
    releaseTimeInput.value = settings.releaseTime;
    cyclesInput.value = settings.cycles;
  });
}

// Send start command to background script
export function handleStart() {
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
export function handleStop() {
  chrome.runtime.sendMessage({ command: 'stopExercise' }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("Error:", chrome.runtime.lastError.message);
      updateStatus('Failed to stop exercise');
    } else {
      updateStatus('Exercise stopped');
      exerciseProgress.textContent = `Cycle 0 of ${cyclesInput.value}`;
      resetCircularProgress(progressCircle);
      toggleStartStopButtons(false);
    }
  });
}

// Retrieve current exercise settings from inputs
export function getExerciseSettings() {
  return {
    holdTime: parseInt(holdTimeInput.value),
    releaseTime: parseInt(releaseTimeInput.value),
    cycles: parseInt(cyclesInput.value),
  };
}

// Handle end of an exercise session
function handleExerciseComplete(totalCycles) {
  updateStatus('Exercise complete!');
  exerciseProgress.textContent = `Congratulations! You completed all ${totalCycles} cycles.`;
  resetCircularProgress(progressCircle);
  toggleStartStopButtons(false);
}

// Add refresh progress function to update stats
function refreshProgress() {
  loadSettings((settings) => {
    const { holdTime, releaseTime, cycles } = settings;
    displayProgressData(holdTime, releaseTime, cycles);
  });
}

// Save exercise settings
export function saveExerciseSettings() {
  saveSettings(getExerciseSettings());
  updateStatus('Settings saved!');
}

// Handle messages from background.js

chrome.runtime.onMessage.addListener((message) => {
  if (message.command === 'updatePhase') {
    updateStatus(`Exercise phase: ${message.phase}`);
    if (message.phase === 'hold') {
      // Start progress bar and countdown for hold phase
      startCircularProgress(parseInt(holdTimeInput.value) * 1000, progressCircle, 'hold');
    } else if (message.phase === 'release') {
      // Start countdown for release phase (no progress bar animation)
      startCircularProgress(parseInt(releaseTimeInput.value) * 1000, progressCircle, 'release');
    }
  } else if (message.command === 'exerciseStopped') {
    if (message.wasCompletedNaturally) {
      handleExerciseComplete(cyclesInput.value);
      refreshProgress();
    } else {
      updateStatus('Exercise stopped');
      exerciseProgress.textContent = `Cycle 0 of ${cyclesInput.value}`;
      resetCircularProgress(progressCircle);
      refreshProgress();
    }
  } else if (message.command === 'updateProgress') {
    updateProgressDisplay(message.currentCycle, message.totalCycles);
  }
});


