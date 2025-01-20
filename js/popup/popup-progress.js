/**
 * This file manages the circular progress bar logic for the popup interface of the Chrome extension.
 * It includes functionality to initialize, start, and reset the progress bar during exercises.
 */

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
let circularProgressInterval;

/** Initializes the circular progress bar properties. */
export function initializeCircularProgress(progressCircle) {
  if (!progressCircle) {
    console.error('Invalid progressCircle provided.');
    return;
  }
  console.log('Initializing circular progress bar...');
  progressCircle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
  progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
}

/** Starts the circular progress animation with countdown and color change. */
export function startCircularProgress(duration, progressCircle, phase) {
  console.log(`Starting circular progress. Phase: ${phase}, Duration: ${duration}ms`);

  if (!progressCircle) {
    console.error('Invalid progressCircle provided.');
    return;
  }

  clearInterval(circularProgressInterval);
  const startTime = Date.now();
  const endTime = startTime + duration;

  // Set progress bar color only for hold phase
  if (phase === 'hold') {
    const progressColor = '#4caf50'; // Example: red for "hold"
    progressCircle.style.stroke = progressColor;
  } else {
    // Reset progress bar for release phase
    progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
  }

  const progressText = document.getElementById('progressText');
  if (!progressText) {
    console.warn('progressText element not found.');
    return;
  }

  circularProgressInterval = setInterval(() => {
    const now = Date.now();
    const elapsed = now - startTime; // Calculate elapsed time
    const remainingTime = Math.ceil((endTime - now) / 1000); // Remaining time in seconds
    const progress = Math.min(elapsed / duration, 1); // Calculate progress

    // Update strokeDashoffset only for hold phase
    if (phase === 'hold') {
      const offset = CIRCUMFERENCE * (1 - progress);
      progressCircle.style.strokeDashoffset = offset;
    }

    // Update countdown text dynamically for both phases
    progressText.textContent = remainingTime > 0 ? `${remainingTime}` : '0';

    if (progress === 1) {
      console.log(`Phase "${phase}" complete. Clearing interval.`);
      clearInterval(circularProgressInterval);
    }
  }, 16);
}



/** Resets the circular progress bar and text. */
export function resetCircularProgress(progressCircle) {
  if (!progressCircle) {
    console.error('Invalid arguments for resetCircularProgress.');
    return;
  }

  console.log('Resetting circular progress bar...');
  clearInterval(circularProgressInterval); // Clear any active intervals
  progressCircle.style.strokeDashoffset = CIRCUMFERENCE;

  // Clear countdown text
  const progressText = document.getElementById('progressText');
  if (progressText) {
    console.log('Resetting text to empty.');
    progressText.textContent = ''; // Clear the text completely
  }
}
