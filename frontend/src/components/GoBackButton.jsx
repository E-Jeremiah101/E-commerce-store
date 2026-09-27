
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function GoBackButton({ fallback = "/" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleGoBack = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigate(location.key !== "default" ? -1 : fallback);
  };

  return (
    <button
      onClick={handleGoBack}
      disabled={isNavigating}
      className={`flex items-center text-neutral-700 hover:text-neutral-900 cursor-pointer transition-colors ${
        isNavigating ? "opacity-50 cursor-not-allowed" : ""
      }`}
      aria-label="Go back"
    >
      <ArrowLeft size={25} className="mr-2" />
    </button>
  );
}