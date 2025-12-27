/**
 * Calculate estimated delivery date based on delivery zone
 * Business days calculation excluding weekends
 */

/**
 * Delivery time estimates by zone (in business days)
 * Monday-Friday, excluding public holidays
 */
const DELIVERY_TIMES = {
  "Same City": { min: 1, max: 2 },
  "Same LGA": { min: 2, max: 3 },
  "Same State": { min: 3, max: 5 },
  "Same Region": { min: 4, max: 6 },
  "Southern Region": { min: 5, max: 7 },
  "Northern Region": { min: 6, max: 10 },
};

/**
 * Add business days to a date (excludes weekends)
 * @param {Date} date - Starting date
 * @param {number} days - Number of business days to add
 * @returns {Date} - New date after adding business days
 */
function addBusinessDays(date, days) {
  const result = new Date(date);
  let count = 0;

  while (count < days) {
    result.setDate(result.getDate() + 1);
    // Check if it's not a weekend (0 = Sunday, 6 = Saturday)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      count++;
    }
  }

  return result;
}

/**
 * Calculate estimated delivery date based on delivery zone
 * @param {string} deliveryZone - The delivery zone
 * @returns {Object} - Contains estimatedDeliveryDate and displayText
 */
export function calculateEstimatedDeliveryDate(deliveryZone) {
  const zone = deliveryZone || "Northern Region";
  const timeEstimate =
    DELIVERY_TIMES[zone] || DELIVERY_TIMES["Northern Region"];

  // Use average of min and max for the estimated date
  const averageDays = Math.ceil((timeEstimate.min + timeEstimate.max) / 2);
  const today = new Date();
  const estimatedDate = addBusinessDays(today, averageDays);

  // Format display text (e.g., "3-5 business days" or "1-2 business days")
  const displayText = `${timeEstimate.min}–${timeEstimate.max} business days`;

  return {
    estimatedDeliveryDate: estimatedDate,
    displayText,
    min: timeEstimate.min,
    max: timeEstimate.max,
    averageDays,
  };
}

/**
 * Format a date for display (e.g., "Jan 15, 2025")
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDeliveryDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get delivery time estimate for a zone
 * @param {string} deliveryZone - The delivery zone
 * @returns {Object} - Time estimate with min and max days
 */
export function getDeliveryTimeEstimate(deliveryZone) {
  const zone = deliveryZone || "Northern Region";
  return DELIVERY_TIMES[zone] || DELIVERY_TIMES["Northern Region"];
}

export default {
  calculateEstimatedDeliveryDate,
  formatDeliveryDate,
  getDeliveryTimeEstimate,
};
