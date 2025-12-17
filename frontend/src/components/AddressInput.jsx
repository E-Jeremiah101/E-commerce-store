// components/AddressInput.js
import { useState, useEffect } from "react";
// import { getAllStates, getLGAsByState } from "../utils/nigerianLocations";
import {
  getAllStates,
  getLGAsByState,
} from "../../../backend/lib/nigerianLocations";


export default function AddressInput({ value, onChange, label = "Address" }) {
  const [address, setAddress] = useState(
    value || {
      state: "",
      city: "",
      lga: "",
      landmark: "",
      address: "",
    }
  );

  const [states] = useState(getAllStates());
  const [lgaOptions, setLgaOptions] = useState([]);

  // Update LGA options when state changes
  useEffect(() => {
    if (address.state) {
      const lgas = getLGAsByState(address.state);
      setLgaOptions(lgas);

      // Reset LGA if not in new options
      if (address.lga && !lgas.includes(address.lga)) {
        setAddress((prev) => ({ ...prev, lga: lgas[0] || "" }));
      }
    }
  }, [address.state]);

  // Handle input changes
  const handleChange = (field, value) => {
    const newAddress = { ...address, [field]: value };
    setAddress(newAddress);
    onChange(newAddress);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{label}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <select
            value={address.state}
            onChange={(e) => handleChange("state", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
            required
          >
            <option value="">Select State</option>
            {states.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
        </div>

        {/* LGA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            LGA *
          </label>
          <select
            value={address.lga}
            onChange={(e) => handleChange("lga", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
            required
            disabled={!address.state}
          >
            <option value="">Select LGA</option>
            {lgaOptions.map((lga) => (
              <option key={lga} value={lga}>
                {lga}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City/Town *
          </label>
          <input
            type="text"
            value={address.city}
            onChange={(e) => handleChange("city", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
            required
            placeholder="e.g., Benin City"
          />
        </div>

        {/* Landmark */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Landmark (Optional)
          </label>
          <input
            type="text"
            value={address.landmark}
            onChange={(e) => handleChange("landmark", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
            placeholder="e.g., Near Main Market"
          />
        </div>
      </div>

      {/* Detailed Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Detailed Address *
        </label>
        <textarea
          value={address.address}
          onChange={(e) => handleChange("address", e.target.value)}
          rows="3"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
          required
          placeholder="House number, street, area"
        />
      </div>
    </div>
  );
}
