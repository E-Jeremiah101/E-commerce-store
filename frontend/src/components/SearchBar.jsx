import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import { Search, X, Loader2 } from "lucide-react";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (query.length < 1) {
      setSuggestions([]);
      setLoading(false); 
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await axios.get(`/products/suggestions?q=${query}`);
        setSuggestions(res.data);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  const handleSelect = (value) => {
    setQuery(value);
    navigate(`/search?q=${encodeURIComponent(value)}`);
    setIsOpen(false);
  };

  const clearQuery = () => {
    setQuery("");
    setSuggestions([]);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md mx-auto rounded-full "
    >
      <form onSubmit={handleSubmit}>
        <div
          className="flex items-center gap-2 bg-white rounded-full px-4 py-2 
                     border border-gray-200 shadow-sm transition-all duration-200
                     focus-within:border-gray-900 focus-within:shadow-md"
        >
          <Search className="w-4 h-4 text-gray-400 shrink-0" />

          <input
            type="text"
            placeholder="Search products..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="flex-1 min-w-0 bg-transparent text-sm text-gray-900 
                       placeholder-gray-400 border-0 outline-none"
          />

          {loading && (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" />
          )}

          {query && !loading && (
            <button
              type="button"
              onClick={clearQuery}
              className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {isOpen && query.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl 
                     shadow-lg border border-gray-100 overflow-hidden z-50
                     animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {suggestions.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto py-1">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  onClick={() => handleSelect(s)}
                  className="px-4 py-2.5 text-sm text-gray-700 cursor-pointer
                             hover:bg-gray-50 hover:text-gray-900 transition-colors
                             flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  <span className="truncate">{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            !loading && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                No results for &ldquo;{query}&rdquo;
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;