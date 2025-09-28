// components/GoBackButton.jsx
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GoBackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)} // 👈 go back to previous page
      className="flex items-center text-gray-700 hover:text-gray-900 mb-4"
    >
      <ArrowLeft size={20} className="mr-2" />
      <span className="font-medium">Back</span>
    </button>
  );
}
