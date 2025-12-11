// deliveryConfig.js
const NIGERIA_DELIVERY_ZONES = {
  warehouse_location: {
    state: "Edo",
    city: "Benin City",
    lga: "Oredo",
    coordinates: { lat: 6.335, lng: 5.6037 },
  },

  zones: [
    {
      id: "zone_1",
      name: "Same City",
      description: "Benin City Metropolitan",
      fee: 10, // ₦500
      coverage: ["Oredo", "Egor", "Ikpoba-Okha"], // LGAs
    },
    {
      id: "zone_2",
      name: "Edo State",
      description: "Other parts of Edo State",
      fee: 15, // ₦1500
      coverage: ["Edo"], // State coverage
    },
    { 
      id: "zone_3",
      name: "South-South Region",
      description: "Neighboring states",
      fee: 20,
      states: ["Delta", "Ondo", "Ekiti", "Kogi", "Anambra"],
    },
    {
      id: "zone_4",
      name: "Southern Region",
      description: "Other southern states",
      fee: 3500,
      states: [
        "Lagos",
        "Ogun",
        "Oyo",
        "Osun",
        "Enugu",
        "Imo",
        "Abia",
        "Rivers",
        "Bayelsa",
        "Cross River",
        "Akwa Ibom",
      ],
    },
    {
      id: "zone_5",
      name: "Northern Region",
      description: "Northern states",
      fee: 5000,
      states: [
        "FCT",
        "Kano",
        "Kaduna",
        "Katsina",
        "Borno",
        "Yobe",
        "Bauchi",
        "Plateau",
        "Niger",
        "Sokoto",
        "Zamfara",
        "Kebbi",
        "Gombe",
        "Adamawa",
        "Taraba",
        "Benue",
        "Nasarawa",
        "Jigawa",
        "Kwara",
      ],
    },
  ],
};

// Helper function to calculate delivery fee based on address
function calculateDeliveryFee(addressState, addressCity = "", addressLGA = "") {
  const warehouseState = NIGERIA_DELIVERY_ZONES.warehouse_location.state;
  const warehouseCity = NIGERIA_DELIVERY_ZONES.warehouse_location.city;
  const warehouseLGAs = NIGERIA_DELIVERY_ZONES.zones[0].coverage;

  // 1. Check if same city (Zone 1)
  if (
    addressState === warehouseState &&
    warehouseLGAs.includes(addressLGA) &&
    addressCity.toLowerCase().includes("benin")
  ) {
    return NIGERIA_DELIVERY_ZONES.zones[0].fee; // ₦500
  }

  // 2. Check if same state but different city (Zone 2)
  if (addressState === warehouseState) {
    return NIGERIA_DELIVERY_ZONES.zones[1].fee; // ₦1500
  }

  // 3. Check for South-South states (Zone 3)
  const southSouthStates = NIGERIA_DELIVERY_ZONES.zones[2].states;
  if (southSouthStates.includes(addressState)) {
    return NIGERIA_DELIVERY_ZONES.zones[2].fee; // ₦2500
  }

  // 4. Check for Southern states (Zone 4)
  const southernStates = NIGERIA_DELIVERY_ZONES.zones[3].states;
  if (southernStates.includes(addressState)) {
    return NIGERIA_DELIVERY_ZONES.zones[3].fee; // ₦3500
  }

  // 5. Default to Northern states (Zone 5)
  return NIGERIA_DELIVERY_ZONES.zones[4].fee; // ₦5000
}

export {
  NIGERIA_DELIVERY_ZONES,
  calculateDeliveryFee,
};
