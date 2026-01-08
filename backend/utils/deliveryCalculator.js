const DELIVERY_TIMES = {
  "Same City": { min: 3, max: 7 },
  "Same LGA": { min: 3, max: 7 },
  "Same State": { min: 3, max: 7 },
  "Same Region": { min: 3, max: 7 },
  "Southern Region": { min: 4, max: 8 },
  "Northern Region": { min: 5, max: 10 },
};


function addBusinessDays(date, days) {
  const result = new Date(date);
  let count = 0;

  while (count < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      count++;
    }
  }

  return result;
}


export function calculateEstimatedDeliveryDate(deliveryZone) {
  const zone = deliveryZone || "Northern Region";
  const timeEstimate =
    DELIVERY_TIMES[zone] || DELIVERY_TIMES["Northern Region"];

  const averageDays = Math.ceil((timeEstimate.min + timeEstimate.max) / 2);
  const today = new Date();
  const estimatedDate = addBusinessDays(today, averageDays);


  const displayText = `${timeEstimate.min}–${timeEstimate.max} business days`;

  return {
    estimatedDeliveryDate: estimatedDate,
    displayText,
    min: timeEstimate.min,
    max: timeEstimate.max,
    averageDays,
  };
}

export function formatDeliveryDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getDeliveryTimeEstimate(deliveryZone) {
  const zone = deliveryZone || "Northern Region";
  return DELIVERY_TIMES[zone] || DELIVERY_TIMES["Northern Region"];
}

export default {
  calculateEstimatedDeliveryDate,
  formatDeliveryDate,
  getDeliveryTimeEstimate,
};
