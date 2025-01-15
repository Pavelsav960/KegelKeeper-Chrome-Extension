// popup-ui.js

/**
 * This file manages the UI updates for the popup interface.
 * It provides functions to update the status message, progress display, and button states.
 */

/** Updates the status message in the popup.
 * @param {string} message - The status message to display.
 */
export function updateStatus(message) {
  console.log("Status:", message);
  const status = document.getElementById('status');
  status.textContent = message;
}

/** Updates the exercise progress display.
 * @param {number} currentCycle - The current cycle number.
 * @param {number} totalCycles - The total number of cycles.
 */
export function updateProgressDisplay(currentCycle, totalCycles) {
  const exerciseProgress = document.getElementById('exerciseProgress');
  exerciseProgress.textContent = `Cycle ${currentCycle} of ${totalCycles}`;
}

/** Enables or disables the start and stop buttons based on the exercise state.
 * @param {boolean} isRunning - Whether the exercise is currently running.
 */
export function toggleStartStopButtons(isRunning) {
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  startButton.disabled = isRunning;
  stopButton.disabled = !isRunning;
}
