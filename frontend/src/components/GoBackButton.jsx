// import { ArrowLeft } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// export default function GoBackButton() {
//   const navigate = useNavigate();

//   const handleGoBack = () => {
    
//     if (window.history.state && window.history.state.idx > 0) {
//       navigate(-1);
//     } else {
//       navigate("/"); // fallback to homepage
//     }
//   };

//   return (
//     <button
//       onClick={handleGoBack} //  go back to previous page
//       className="flex items-center text-gray-700 hover:text-gray-900 cursor-pointer"
//     >
//       <ArrowLeft size={25} className="mr-2" />

//     </button>
//   );
// }

import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function GoBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleGoBack = () => {
    // Prevent multiple clicks
    if (isNavigating) return;

    setIsNavigating(true);

    // Check if we came from another page in our app
    const referrer = document.referrer;
    const currentOrigin = window.location.origin;

    // If referrer exists and is from our app, go back
    if (referrer && referrer.startsWith(currentOrigin)) {
      navigate(-1);
    } else {
      // Otherwise, go to homepage
      navigate("/");
    }

    // Reset after navigation
    setTimeout(() => setIsNavigating(false), 500);
  };

  return (
    <button
      onClick={handleGoBack}
      disabled={isNavigating}
      className={`flex items-center text-gray-700 hover:text-gray-900 cursor-pointer transition-colors ${
        isNavigating ? "opacity-50 cursor-not-allowed" : ""
      }`}
      aria-label="Go back"
    >
      <ArrowLeft
        size={25}
        className={`mr-2 ${isNavigating ? "animate-pulse" : ""}`}
      />
      <span className="text-sm font-medium hidden sm:inline">Back</span>
    </button>
  );
}
