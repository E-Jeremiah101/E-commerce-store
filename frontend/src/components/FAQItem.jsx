import {useState} from 'react'
import { ChevronUp, ChevronDown } from "lucide-react";


const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

  return (
    <div className=" border-gray-700 py-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full text-left focus:outline-none"
      >
        <span className="text-black/70 bg-gray-200 rounded-4xl mr-3 transition-transform duration-300 h-7 w-7 flex items-center justify-center">
          {isOpen ?  <ChevronDown size={22} /> : <ChevronUp size={22} />}
        </span>

        <span className="text-sm font-light text-black hover:text-black/60 transition-colors">
          {question}
        </span>

      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-40 mt-2" : "max-h-0"
        }`}
      >
        <p className="text-black text-sm pl-9 pr-3 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

export default FAQItem