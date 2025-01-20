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
  console.log('Executing next phase...');
  const { currentCycle, isActive } = exerciseState;
  console.log('Current cycle:', currentCycle);
  console.log('Is exercise active:', isActive);

  if (currentCycle < settings.cycles * 2 && isActive) {
    const isHoldPhase = currentCycle % 2 === 0;
    console.log('Is hold phase:', isHoldPhase);

    handlePhaseUpdate(isHoldPhase, settings);
    scheduleNextPhase(isHoldPhase, settings);
  } else {
    console.log('Exercise complete. Stopping...');
    stopExercise(true);
  }
}


/**
 * Handles phase updates: feedback, progress updates, and UI changes.
 */
function handlePhaseUpdate(isHoldPhase, settings) {
  console.log('Handling phase update...');
  console.log('Is hold phase:', isHoldPhase);

  applyPhaseFeedback(isHoldPhase);

  if (isHoldPhase) {
    sendHoldPhaseUpdates(settings);
  } else {
    console.log('Preparing to start release phase...');
    sendReleasePhaseUpdates(settings);
  }

  // Increment cycle
  exerciseState.currentCycle++;
  console.log('Cycle incremented. Current cycle:', exerciseState.currentCycle);
  chrome.storage.local.set({ currentCycle: exerciseState.currentCycle });
}


function sendHoldPhaseUpdates(settings, progressCircle) {
  const completedCycle = Math.floor(exerciseState.currentCycle / 2) + 1;

  chrome.runtime.sendMessage({
    command: 'updateProgress',
    currentCycle: completedCycle,
    totalCycles: settings.cycles,
  });

  chrome.runtime.sendMessage({ command: COMMAND_UPDATE_PHASE, phase: PHASE_HOLD });

  // Pass progressCircle to startCircularProgress
  startCircularProgress(settings.holdTime * 1000, progressCircle, 'hold');
}

function sendReleasePhaseUpdates(settings, progressCircle) {
  chrome.runtime.sendMessage({ command: COMMAND_UPDATE_PHASE, phase: PHASE_RELEASE });

  // Pass progressCircle to startCircularProgress
  startCircularProgress(settings.releaseTime * 1000, progressCircle, 'release');
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

/** Starts the circular progress bar animation during a phase. */
function startCircularProgress(duration, phase) {
  chrome.runtime.sendMessage({
    command: 'startCircularProgress',
    duration: duration * 1000,
    phase,
  });
}

/** Resets the circular progress bar during the "release" phase. */
function resetCircularProgress() {
  chrome.runtime.sendMessage({ command: 'resetCircularProgress' });
}
