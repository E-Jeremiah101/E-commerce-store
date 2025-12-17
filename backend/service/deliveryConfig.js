import StoreSettings from "../models/storeSettings.model.js";

// Complete Nigerian states and LGAs
export const NIGERIAN_STATES = {
  ABIA: {
    capital: "Umuahia",
    lgas: [
      "Aba North",
      "Aba South",
      "Arochukwu",
      "Bende",
      "Ikwuano",
      "Isiala Ngwa North",
      "Isiala Ngwa South",
      "Isuikwuato",
      "Obi Ngwa",
      "Ohafia",
      "Osisioma",
      "Ugwunagbo",
      "Ukwa East",
      "Ukwa West",
      "Umuahia North",
      "Umuahia South",
      "Umu Nneochi",
    ],
  },
  ADAMAWA: {
    capital: "Yola",
    lgas: [
      "Demsa",
      "Fufure",
      "Ganye",
      "Gayuk",
      "Gombi",
      "Grie",
      "Hong",
      "Jada",
      "Lamurde",
      "Madagali",
      "Maiha",
      "Mayo Belwa",
      "Michika",
      "Mubi North",
      "Mubi South",
      "Numan",
      "Shelleng",
      "Song",
      "Toungo",
      "Yola North",
      "Yola South",
    ],
  },
  // ... (include all 36 states + FCT - I'll show the pattern, you need to add them all)
  EDO: {
    capital: "Benin City",
    lgas: [
      "Akoko-Edo",
      "Egor",
      "Esan Central",
      "Esan North-East",
      "Esan South-East",
      "Esan West",
      "Etsako Central",
      "Etsako East", 
      "Etsako West",
      "Igueben",
      "Ikpoba-Okha",
      "Orhionmwon",
      "Oredo",
      "Ovia North-East",
      "Ovia South-West",
      "Owan East",
      "Owan West",
      "Uhunmwonde",
    ],
  },
  // Add all other states...
};

// Nigerian regions mapping
export const NIGERIAN_REGIONS = {
  SOUTH_SOUTH: [
    "Delta",
    "Edo",
    "Bayelsa",
    "Cross River",
    "Akwa Ibom",
    "Rivers",
  ],
  SOUTH_EAST: ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"],
  SOUTH_WEST: ["Lagos", "Ogun", "Ondo", "Osun", "Oyo", "Ekiti"],
  NORTH_CENTRAL: [
    "Benue",
    "Kogi",
    "Kwara",
    "Nasarawa",
    "Niger",
    "Plateau",
    "FCT",
  ],
  NORTH_EAST: ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"],
  NORTH_WEST: [
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Sokoto",
    "Zamfara",
  ],
};

// Helper function to get region by state name
function getRegionByStateName(stateName, nigeriaConfig) {
  if (!nigeriaConfig?.regions) {
    // Use default regions if not configured
    for (const [region, states] of Object.entries(NIGERIAN_REGIONS)) {
      if (states.includes(stateName)) {
        return region;
      }
    }
    return null;
  }

  // Use configured regions
  const regionMap = Object.fromEntries(nigeriaConfig.regions);
  for (const [region, states] of Object.entries(regionMap)) {
    if (states.includes(stateName)) {
      return region;
    }
  }
  return null;
}

// Helper to get all states
export function getAllStates() {
  return Object.keys(NIGERIAN_STATES).map((key) => ({
    value: key,
    label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  }));
}

// Helper to get LGAs by state
export function getLGAsByState(stateKey) {
  const state = NIGERIAN_STATES[stateKey];
  return state ? state.lgas : [];
}

// Default calculation (if no store settings)
function calculateDefaultZone(deliveryAddress) {
  const { state, city, lga } = deliveryAddress;

  if (state === "Edo" && ["Oredo", "Egor", "Ikpoba-Okha"].includes(lga)) {
    return "sameCity";
  }
  if (state === "Edo") {
    return "sameState";
  }
  if (["Delta", "Ondo", "Ekiti", "Kogi", "Anambra"].includes(state)) {
    return "sameRegion";
  }
  if (
    [
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
    ].includes(state)
  ) {
    return "southern";
  }
  return "northern";
}

// Helper function to get delivery zone based on admin's warehouse location
async function getDeliveryZone(deliveryAddress, storeSettings) {
  const { warehouseLocation, nigeriaConfig } = storeSettings;

  // If no store settings, use default
  if (!warehouseLocation || !warehouseLocation.state) {
    return calculateDefaultZone(deliveryAddress);
  }

  const adminState = warehouseLocation.state;
  const adminCity = warehouseLocation.city;
  const adminLGA = warehouseLocation.lga;

  const customerState = deliveryAddress.state;
  const customerCity = deliveryAddress.city;
  const customerLGA = deliveryAddress.lga;

  // 1. Same City (same LGA or neighboring LGAs)
  if (
    customerState === adminState &&
    customerCity?.toLowerCase() === adminCity?.toLowerCase()
  ) {
    return "sameCity";
  }

  // 2. Same LGA (different city but same LGA - for metropolitan areas)
  if (customerState === adminState && customerLGA === adminLGA) {
    return "sameLGA";
  }

  // 3. Same State (different LGA)
  if (customerState === adminState) {
    return "sameState";
  }

  // 4. Check if in same region
  const adminRegion = getRegionByStateName(adminState, nigeriaConfig);
  const customerRegion = getRegionByStateName(customerState, nigeriaConfig);

  if (adminRegion && customerRegion && adminRegion === customerRegion) {
    return "sameRegion";
  }

  // 5. Check if southern states
  const southernRegions = ["SOUTH_SOUTH", "SOUTH_EAST", "SOUTH_WEST"];
  if (customerRegion && southernRegions.includes(customerRegion)) {
    return "southern";
  }

  // 6. Default to northern
  return "northern";
}

// Main delivery fee calculation function
export async function calculateDeliveryFee(deliveryAddress) {
  try {
    // Get current store settings
    const storeSettings = await StoreSettings.findOne();

    if (!storeSettings) {
      throw new Error("Store settings not found");
    }

    // Determine delivery zone
    const zone = await getDeliveryZone(deliveryAddress, storeSettings);

    // Get fee based on zone
    const shippingFees = storeSettings.shippingFees || {
      sameCity: 500,
      sameLGA: 1000,
      sameState: 1500,
      sameRegion: 2500,
      southern: 3500,
      northern: 5000,
    };

    const fee = shippingFees[zone] || shippingFees.northern;

    return {
      fee,
      zone,
      warehouseLocation: storeSettings.warehouseLocation,
    };
  } catch (error) {
    console.error("Error calculating delivery fee:", error);

    // Fallback to default calculation
    const zone = calculateDefaultZone(deliveryAddress);
    const defaultFees = {
      sameCity: 500,
      sameLGA: 1000,
      sameState: 1500,
      sameRegion: 2500,
      southern: 3500,
      northern: 5000,
    };

    return {
      fee: defaultFees[zone] || 5000,
      zone,
      warehouseLocation: null,
    };
  }
}

// Export the old calculateDeliveryFee for backward compatibility
export function calculateDeliveryFeeOld(addressState, addressCity, addressLGA) {
  // This is the old function signature for backward compatibility
  return calculateDeliveryFee({
    state: addressState,
    city: addressCity,
    lga: addressLGA,
  });
}
