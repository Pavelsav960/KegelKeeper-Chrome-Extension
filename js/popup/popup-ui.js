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



/** Displays progress tracking data in the popup.
 * Fetches progress data from storage and updates the corresponding elements.
 */
export function displayProgressData(holdTime, releaseTime, cycles) {
  import('../progressTracker.js').then(({ getProgressData, calculateTotalHoldingTime }) => {
    getProgressData((progress) => {
      // Update total sessions, streak, and longest streak
      const totalSessionsElement = document.getElementById('total-sessions');
      const currentStreakElement = document.getElementById('current-streak');
      const longestStreakElement = document.getElementById('longest-streak');

      if (totalSessionsElement) {
        totalSessionsElement.textContent = progress.totalSessions || 0;
      }

      if (currentStreakElement) {
        currentStreakElement.textContent = `${progress.streak || 0} days`;
      }

      if (longestStreakElement) {
        longestStreakElement.textContent = `${Math.max(progress.longestStreak, progress.streak) || 0} days`; // Ensure logical longest streak
      }

      // Calculate and update total holding time
      calculateTotalHoldingTime(holdTime, releaseTime, cycles).then((totalTime) => {
        const totalHoldingTimeElement = document.getElementById('total-holding-time');
        if (totalHoldingTimeElement) {
          totalHoldingTimeElement.textContent = `${totalTime || 0} mins`;
        }
      });

      // Update session history
      const sessionHistoryContainer = document.getElementById('session-history');
      if (sessionHistoryContainer) {
        sessionHistoryContainer.innerHTML = ''; // Clear existing entries

        progress.sessionHistory.forEach((session) => {
          const sessionElement = document.createElement('li'); // Use <li> for better semantics
          sessionElement.textContent = `Date: ${session.date}`;
          sessionHistoryContainer.appendChild(sessionElement);
        });
      }
    });
  });
}
