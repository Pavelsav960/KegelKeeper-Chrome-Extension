export const exercisePlans = {
  beginner: {
    name: "Beginner",
    holdTime: 3,
    releaseTime: 3,
    cycles: 5,
    difficulty: "🟢", // Visual cue
  },
  intermediate: {
    name: "Intermediate",
    holdTime: 5,
    releaseTime: 5,
    cycles: 7,
    difficulty: "🟡", // Visual cue
  },
  advanced: {
    name: "Advanced",
    holdTime: 7,
    releaseTime: 7,
    cycles: 10,
    difficulty: "🔴", // Visual cue
  },
};

/**
 * Populates the exercise plans dropdown with visual cues.
 * @param {HTMLElement} dropdown - The dropdown element.
 */
export function populateExercisePlansDropdown(dropdown) {
  // Clear existing options to prevent duplicates
  dropdown.innerHTML = "";

  // Populate the dropdown with new options
  Object.keys(exercisePlans).forEach((planKey) => {
    const plan = exercisePlans[planKey];
    const option = document.createElement("option");
    option.value = planKey;
    option.textContent = `${plan.difficulty} ${plan.name}`; // Include visual cue
    dropdown.appendChild(option);
  });
}

/**
 * Retrieves settings for the selected plan.
 * @param {string} planKey - The key of the selected plan.
 * @returns {object|null} - The plan settings or null if not found.
 */
export function getPlanSettings(planKey) {
  return exercisePlans[planKey] || null;
}
