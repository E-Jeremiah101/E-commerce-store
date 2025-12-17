import { useState, useEffect } from "react";
import {
  getAllStates,
  getCitiesByState,
  getAreasByCity,
  getPrimaryLGAForCity,
} from "../utils/nigerianLocations.js";

export default function AddressInput({
  value,
  onChange,
  label = "Delivery Address",
}) {
  const [address, setAddress] = useState(
    value || {
      state: "",
      city: "",
      area: "",
      landmark: "",
      address: "",
      lga: "", // Auto-derived field
    }
  );

  const [states] = useState(getAllStates());
  const [cityOptions, setCityOptions] = useState([]);
  const [areaOptions, setAreaOptions] = useState([]);

  // Update cities when state changes
  useEffect(() => {
    if (address.state) {
      const cities = getCitiesByState(address.state);
      setCityOptions(cities);
      setAreaOptions([]);

      // Auto-clear city and area when state changes
      const newAddress = {
        ...address,
        city: "",
        area: "",
        lga: "",
      };
      setAddress(newAddress);
      onChange(newAddress);
    }
  }, [address.state]);

  // Update areas and auto-derive LGA when city changes
  useEffect(() => {
    if (address.state && address.city) {
      const areas = getAreasByCity(address.state, address.city);
      setAreaOptions(areas);

      // Auto-derive LGA from city
      const derivedLGA = getPrimaryLGAForCity(address.state, address.city);

      const newAddress = {
        ...address,
        area: "",
        lga: derivedLGA,
      };
      setAddress(newAddress);
      onChange(newAddress);
    }
  }, [address.state, address.city]);

  // Handle input changes
  const handleChange = (field, value) => {
    const newAddress = { ...address, [field]: value };

    // If changing city, also update LGA
    if (field === "city" && value && address.state) {
      newAddress.lga = getPrimaryLGAForCity(address.state, value);
    }

    setAddress(newAddress);
    onChange(newAddress);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{label}</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <select
            value={address.city}
            onChange={(e) => handleChange("city", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
            required
            disabled={!address.state}
          >
            <option value="">Select City</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Area (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Area (Optional)
          </label>
          <select
            value={address.area}
            onChange={(e) => handleChange("area", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
            disabled={!address.city}
          >
            <option value="">Select Area</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hidden LGA field (auto-derived) */}
      <input type="hidden" name="lga" value={address.lga} />

      {/* Landmark and Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Landmark (Optional)
        </label>
        <input
          type="text"
          value={address.landmark}
          onChange={(e) => handleChange("landmark", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 mb-4 focus:ring-2 focus:ring-black focus:outline-none"
          placeholder="e.g., Near GTBank, Opposite Main Market"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Detailed Address *
        </label>
        <textarea
          value={address.address}
          onChange={(e) => handleChange("address", e.target.value)}
          rows="3"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
          required
          placeholder="House number, street, building name, etc."
        />
      </div>

      {/* Debug info (remove in production) */}
      <div className="text-xs text-gray-500 mt-2">
        Auto-derived LGA:{" "}
        <span className="font-medium">{address.lga || "Not set"}</span>
      </div>
    </div>
  );
}
