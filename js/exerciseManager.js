import { updateProgress } from './progressTracker.js';

// Constants
const PHASE_HOLD = 'hold';
const PHASE_RELEASE = 'release';
const COMMAND_UPDATE_PHASE = 'updatePhase';

// Default exercise configuration and initial state
const exerciseConfig = { holdTime: 5, releaseTime: 5, cycles: 10 };
const exerciseState = { timer: null, currentCycle: 0, isActive: false };

/**
 * Starts the exercise sequence with the given settings.
 * Initializes the state and begins the first phase.
 */
export async function startExercise(settings = exerciseConfig) {
  await ensureOffscreenDocument();
  resetExerciseState();
  Object.assign(exerciseState, { isActive: true });
  chrome.storage.local.set({ exerciseState: { isActive: true, settings } });
  executeNextPhase(settings);
}

/** Returns the current exercise state. */
export function getExerciseState() {
  return exerciseState;
}

/**
 * Ensures the offscreen document for audio playback is created.
 */
async function ensureOffscreenDocument() {
  try {
    const hasDocument = await chrome.offscreen.hasDocument();
    if (!hasDocument) {
      await chrome.offscreen.createDocument({
        url: '../views/offscreen.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Play exercise audio while extension is in the background',
      });
    }
  } catch (error) {
    console.error("Error creating offscreen document:", error);
    chrome.runtime.sendMessage({ command: 'showError', error: 'Audio functionality unavailable.' });
  }
}

/**
 * Handles each phase of the exercise (hold or release).
 * Sends updates to the popup and manages the circular progress bar.
 */
function executeNextPhase(settings) {
  const { currentCycle, isActive } = exerciseState;

  if (currentCycle < settings.cycles * 2 && isActive) {
    const isHoldPhase = currentCycle % 2 === 0;

    handlePhaseUpdate(isHoldPhase, settings);
    scheduleNextPhase(isHoldPhase, settings);
  } else {
    stopExercise(true);
  }
}

/**
 * Handles phase updates: feedback, progress updates, and UI changes.
 */
function handlePhaseUpdate(isHoldPhase, settings) {
  applyPhaseFeedback(isHoldPhase);

  if (isHoldPhase) {
    sendHoldPhaseUpdates(settings);
  } else {
    sendReleasePhaseUpdates();
  }

  // Increment cycle
  exerciseState.currentCycle++;
  chrome.storage.local.set({ currentCycle: exerciseState.currentCycle });
}

function sendHoldPhaseUpdates(settings) {
  const completedCycle = Math.floor(exerciseState.currentCycle / 2) + 1;

  chrome.runtime.sendMessage({
    command: 'updateProgress',
    currentCycle: completedCycle,
    totalCycles: settings.cycles,
  });

  chrome.runtime.sendMessage({ command: COMMAND_UPDATE_PHASE, phase: PHASE_HOLD });
  startCircularProgress(settings.holdTime);
}


function sendReleasePhaseUpdates() {
  chrome.runtime.sendMessage({ command: COMMAND_UPDATE_PHASE, phase: PHASE_RELEASE });
  resetCircularProgress();
}

function scheduleNextPhase(isHoldPhase, settings) {
  const duration = isHoldPhase ? settings.holdTime : settings.releaseTime;
  schedulePhaseTimeout(duration, settings);
}

/**
 * Sends phase-related feedback (visual/audio).
 */
async function applyPhaseFeedback(isHoldPhase) {
  const phase = isHoldPhase ? PHASE_HOLD : PHASE_RELEASE;
  chrome.storage.local.set({ phase });

  chrome.runtime.sendMessage({ command: COMMAND_UPDATE_PHASE, phase }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('Popup is not open; skipping phase update.');
    } else {
      console.log('Phase update response:', response);
    }
  });

  const muted = await isMuted();
  if (!muted) {
    chrome.runtime.sendMessage({ command: 'playAudio', type: phase }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Audio playback message failed:', chrome.runtime.lastError.message);
      } else {
        console.log('Audio playback initiated:', response);
      }
    });
  }
}

/** Checks if sound is muted. */
async function isMuted() {
  return new Promise((resolve) => {
    chrome.storage.local.get('isMuted', (data) => {
      resolve(data.isMuted || false);
    });
  });
}

/** Schedules the timeout for the next phase. */
function schedulePhaseTimeout(duration, settings) {
  clearTimeout(exerciseState.timer);
  exerciseState.timer = setTimeout(() => executeNextPhase(settings), duration * 1000);
}

/** Stops the exercise and clears the state. */
export function stopExercise(wasCompletedNaturally = false) {
  clearTimeout(exerciseState.timer);
  chrome.alarms.clearAll();
  exerciseState.isActive = false;
  chrome.storage.local.set({ exerciseState: { isActive: false } });

  if (wasCompletedNaturally) {
    updateProgress(); // Log the completed session without sets
  }

  chrome.runtime.sendMessage({ command: 'exerciseStopped', wasCompletedNaturally });
}

/** Resets the exercise state to default. */
function resetExerciseState() {
  Object.assign(exerciseState, { timer: null, currentCycle: 0, isActive: false });
}

/** Starts the circular progress bar animation during the "hold" phase. */
function startCircularProgress(holdTime) {
  chrome.runtime.sendMessage({
    command: 'startCircularProgress',
    duration: holdTime * 1000,
  });
}

/** Resets the circular progress bar during the "release" phase. */
function resetCircularProgress() {
  chrome.runtime.sendMessage({ command: 'resetCircularProgress' });
}
