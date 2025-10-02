import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../lib/axios";
import { useCartStore } from "../stores/useCartStore";
import { toast } from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import GoBackButton from "../components/GoBackButton";

const SearchResultsPage = () => {
  const [products, setProducts] = useState([]);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");

  const [selectedOptions, setSelectedOptions] = useState({});
  const { addToCart } = useCartStore();

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      try {
        const res = await axios.get(`/products/search?q=${query}`);
        setProducts(res.data);

        // initialize dropdown defaults
        const defaults = {};
        res.data.forEach((product) => {
          defaults[product._id] = {
            size: product.sizes?.[0] || "",
            color: product.colors?.[0] || "",
          };
        });
        setSelectedOptions(defaults);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };
    fetchResults();
  }, [query]);

  const handleAddToCart = (product) => {
    const { size, color } = selectedOptions[product._id] || {};

    if (product.sizes?.length > 0 && !size) {
      toast.error("Please select a size");
      return;
    }
    if (product.colors?.length > 0 && !color) {
      toast.error("Please select a color");
      return;
    }

    addToCart(product, size || null, color || null);
 
  };

  return (
    <>
      <div className="p-6">
        <GoBackButton />
      </div>

      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">
          Search Results for: "{query}"
        </h1>

        {products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const { size, color } = selectedOptions[product._id] || {};

              return (
                <div
                  key={product._id}
                  className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden h-full transition-all duration-300 hover:shadow-xl border border-emerald-500/30"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                  />
                  <div className="p-4">
                    <h3 className="text-lg  mb-2 text-black tracking-widest">
                      {product.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-1">
                      {product.category}
                    </p>
                    <p className="text-black font-medium mb-4 tracking-widest">
                      ₦
                      {product.price.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                      })}
                    </p>

                    {product.sizes?.length > 0 && (
                      <div className="mb-2">
                        <select
                          value={size}
                          onChange={(e) =>
                            setSelectedOptions((prev) => ({
                              ...prev,
                              [product._id]: {
                                ...prev[product._id],
                                size: e.target.value,
                              },
                            }))
                          }
                          className="bg-gray-700 text-white px-2 py-1 rounded text-sm tracking-widest"
                        >
                          {product.sizes.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {product.colors?.length > 0 && (
                      <div className="mb-2">
                        <select
                          value={color}
                          onChange={(e) =>
                            setSelectedOptions((prev) => ({
                              ...prev,
                              [product._id]: {
                                ...prev[product._id],
                                color: e.target.value,
                              },
                            }))
                          }
                          className="bg-gray-700 text-white px-2 py-1 rounded text-sm tracking-widest"
                        >
                          {product.colors.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      onClick={() => handleAddToCart(product)}
                      className="mt-auto w-full bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded flex items-center justify-center"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default SearchResultsPage;
