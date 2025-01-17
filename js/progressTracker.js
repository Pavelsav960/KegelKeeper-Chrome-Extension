// Default progress data structure
const defaultProgressData = {
  totalSessions: 0,
  streak: 0,
  longestStreak: 0, // Track the longest streak
  sessionHistory: [] // Array of objects: { date: 'YYYY-MM-DD', setsCompleted: Number }
};

/**
 * Saves progress data to Chrome storage.
 * @param {Object} progress - The progress data to save.
 */
function saveProgressData(progress) {
  chrome.storage.local.set({ progressData: progress }, () => {
    console.log('Progress data saved:', JSON.stringify(progress, null, 2));
  });
}

/**
 * Retrieves progress data from Chrome storage.
 * @param {Function} callback - Function to call with the retrieved progress data.
 */
function getProgressData(callback) {
  chrome.storage.local.get(['progressData'], (result) => {
    const progress = result.progressData || { ...defaultProgressData };
    callback(progress);
  });
}

/**
 * Resets progress data to default values.
 */
function resetProgressData() {
  saveProgressData({ ...defaultProgressData });
  console.log('Progress data reset to default');
}

/**
 * Updates progress data after a session.
 * Ensures `longestStreak` is calculated correctly and adds today's session.
 */
/**
 * Updates progress data after a session.
 * Ensures `longestStreak` is calculated correctly and adds today's session with a timestamp.
 */
function updateProgress(setsCompleted = 10) {
  getProgressData((progress) => {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toISOString().split('T')[1]; // Extract time part

    // Debug: Log initial progress data
    console.log('Initial progress data:', JSON.stringify(progress, null, 2));

    // Check if a session with today's date and the same time is already logged
    const isTodayLogged = progress.sessionHistory.some(
      (session) => session.date === today && session.time === currentTime && session.setsCompleted === setsCompleted
    );

    if (!isTodayLogged) {
      progress.totalSessions += 1; // Increment total sessions
      progress.sessionHistory.push({ date: today, time: currentTime, setsCompleted });
      console.log(`Session added. Total sessions: ${progress.totalSessions}`);
    } else {
      console.warn("Session already logged for this time. Skipping increment.");
    }

    // Handle streak logic
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastSession = progress.sessionHistory[progress.sessionHistory.length - 2]; // Second to last session

    if (lastSession?.date === yesterday) {
      progress.streak += 1; // Continue streak
    } else if (lastSession?.date !== today) {
      progress.streak = 1; // Reset streak if not consecutive
    }

    // Update longest streak
    const previousLongest = progress.longestStreak;
    progress.longestStreak = Math.max(progress.longestStreak, progress.streak);
    console.log(
      `Longest streak updated: Previous - ${previousLongest}, Current - ${progress.longestStreak}`
    );

    // Debug: Log updated progress data before saving
    console.log('Updated progress data before saving:', JSON.stringify(progress, null, 2));

    // Save the updated progress data
    saveProgressData(progress);

    // Verify saved progress data
    chrome.storage.local.get(['progressData'], (data) => {
      console.log('Stored progressData after save:', JSON.stringify(data.progressData, null, 2));
    });

    // Notify UI to refresh progress data
    chrome.runtime.sendMessage({ command: 'refreshProgress' });
  });
}


/**
 * Calculates total holding time (assuming a predefined session length).
 * @param {number} holdTime - Time spent in each session (in seconds).
 * @param {number} releaseTime - Time spent in each release (in seconds).
 * @param {number} cycles - Number of cycles per session.
 * @returns {Promise<string>} - Total holding time in minutes.
 */
function calculateTotalHoldingTime(holdTime, releaseTime, cycles) {
  return new Promise((resolve) => {
    getProgressData((progress) => {
      const totalTimeSeconds =
        progress.totalSessions * cycles * (holdTime + releaseTime);
      const totalTimeMinutes = Math.floor(totalTimeSeconds / 60);
      resolve(totalTimeMinutes);
    });
  });
}

export {
  getProgressData,
  saveProgressData,
  resetProgressData,
  updateProgress,
  calculateTotalHoldingTime
};
