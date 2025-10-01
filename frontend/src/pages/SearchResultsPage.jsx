import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../lib/axios";

const SearchResultsPage = () => {
  const [products, setProducts] = useState([]);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      try {
        const res = await axios.get(`/products/search?q=${query}`);
        setProducts(res.data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };
    fetchResults();
  }, [query]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Search Results for: "{query}"</h1>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product._id} className="border p-4 rounded">
              <img
                src={product.image}
                alt={product.name}
                className="h-40 w-full object-cover mb-2"
              />
              <h2 className="font-semibold">{product.name}</h2>
              <p className="text-emerald-600">₦{product.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;
