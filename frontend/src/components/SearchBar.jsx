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
      <form onSubmit={handleSubmit} className=" gap-2 items-center px-2">
        <div className="text-white flex items-center justify-between border-1 outline-2  p-2 rounded w-full ">
          <input
            type="text"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className=" text-white w-80 text-lg border-0 outline-0"
          />
          <button type="submit" className="">
            <Search />{" "}
          </button>
        </div>
      </form>

      {suggestions.length > 0 && (
        <div className="   bg-black top-9 rounded mt-1 shadow-lg z-50  ">
          <ul>
            <h2 className="px-3 pt-5 pb-2 tracking-widest text-gray-300 ">SUGGESTIONS</h2>
            <hr className="ml-3 text-white"/>
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











// const SearchBars = () => {
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState([]);

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     if (!query) return;

//     const res = await axios.get(`/products/search?q=${query}`);
//     setResults(res.data);
//   };

//   return (
//     <div className="p-4">
//       <form onSubmit={handleSearch} className="flex gap-2 items-center">
//         <div className="text-white flex items-center justify-between border-1 outline-2  p-2 rounded w-full">
//           <input
//             type="text"
//             placeholder="Search products..."
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             className=" text-white w-80 text-lg border-0 outline-0"
//           />
//           <button type="submit" className="">
//             <Search />
//           </button>
//         </div>
//         {/* <X className="text-white"/> */}
//       </form>

//       <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-white">
//         {results.map((product) => (
//           <div key={product._id} className="border p-4 rounded">
//             <img
//               src={product.image}
//               alt={product.name}
//               className="h-40 w-full object-cover mb-2"
//             />
//             <h2 className="font-semibold">{product.name}</h2>
//             <p>₦ {product.price.toLocaleString(undefined,{ minimumFractionDigits: 0,})}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default SearchBars;
