// components/GoBackButton.jsx
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GoBackButton() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/"); // fallback to homepage
    }
  };

  return (
    <button
      onClick={handleGoBack} // 👈 go back to previous page
      className="flex items-center text-gray-700 hover:text-gray-900 cursor-pointer"
    >
      <ArrowLeft size={25} className="mr-2" />

    </button>
  );
}
