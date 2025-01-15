// popup-progress.js

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
  progressCircle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
  progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
}

/** Starts the circular progress animation. */
export function startCircularProgress(duration, progressCircle) {
  if (!progressCircle) {
    console.error('Invalid arguments for startCircularProgress.');
    return;
  }

  clearInterval(circularProgressInterval);
  const startTime = Date.now();
  const endTime = startTime + duration;

  circularProgressInterval = setInterval(() => {
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const offset = CIRCUMFERENCE * (1 - progress);
    progressCircle.style.strokeDashoffset = offset;

    if (progress === 1) {
      clearInterval(circularProgressInterval);
      progressCircle.style.strokeDashoffset = 0;
    }
  }, 16);
}

/** Resets the circular progress bar. */
export function resetCircularProgress(progressCircle) {
  if (!progressCircle) {
    console.error('Invalid arguments for resetCircularProgress.');
    return;
  }

  clearInterval(circularProgressInterval);
  progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
}