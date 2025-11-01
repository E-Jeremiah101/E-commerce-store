import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import { Search } from "lucide-react";
import { div } from "framer-motion/client";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 1) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`/products/suggestions?q=${query}`);
        console.log("Suggestions:", res.data); // 
        setSuggestions(res.data);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    const delayDebounce = setTimeout(fetchSuggestions, 300); // debounce
    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${query}`);
    }
  };

  return (
    <div className=" w-full max-w-md mx-auto text-white bg-black ">
      <form onSubmit={handleSubmit} className=" gap-2 items-center ">
        <div className="text-black flex items-center justify-between border-none outline-solid  p-2 rounded w-full outline-gray-200 border-gray-00 ">
          <input
            type="text"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className=" text-white w-80 text-lg border-0 outline-0"
          />
          <button type="submit" className=" text-gray-300">
            <Search />{" "}
          </button>
        </div>
      </form>

      {suggestions.length > 0 && (
        <div className="    bg-gradient-to-br from-white via-gray-100 to-gray-300 top-9 rounded mt-1 shadow-lg z-50 text-black ">
          <ul>
            <h2 className="px-3 pt-5 pb-2 tracking-widest text-black ">
              SUGGESTIONS
            </h2>
            <hr className="ml-3 text-black" />
            {suggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => {
                  setQuery(s);
                  navigate(`/search?q=${s}`);
                }}
                className="px-3 py-2 hover:text-gray-60  cursor-pointer tracking-widest"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;