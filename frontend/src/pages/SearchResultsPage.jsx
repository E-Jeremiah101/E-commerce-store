import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "../lib/axios";
import { useCartStore } from "../stores/useCartStore";
import { toast } from "react-hot-toast";
import GoBackButton from "../components/GoBackButton";
import { motion } from "framer-motion";

const SearchResultsPage = () => {
  const [products, setProducts] = useState([]);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");

  const [selectedOptions, setSelectedOptions] = useState({});
  const { addToCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      setLoading(true);
      setSearched(true);
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
      }finally{
        setLoading(false);
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
      <motion.div
        className="sm:mx-auto sm:w-full sm:max-w-md fixed top-0 left-0 right-0  flex items-center justify-center bg-white  z-40 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute left-4 text-black">
          <GoBackButton />
        </div>
        <span className=" text-center text-xl  text-gray-900 tracking-widest">
          Search Results
        </span>
      </motion.div>

      <div className="p-6 mt-8">
        <h1 className="text-center text-xl text-black tracking-widest py-4">
           {query}
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-40">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
    </div>) :

        products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const { size, color } = selectedOptions[product._id] || {};

              return (
                <div
                  key={product._id}
                  className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden h-full transition-all duration-300 hover:shadow-xl border border-white"
                >
                  <img
                    src={product.images?.[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                  />
                  <div className="p-4">
                    <h3 className="text-lg h-11 mb-2 font-semibold text-black tracking-widest">
                      {product.name}
                    </h3>

                    <p className="text-black font-medium mb-4 tracking-widest">
                      ₦{" "}
                      {product.price.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                      })}
                    </p>
                    <Link to={`/product/${product._id}`}>
                      <button className="mt-auto w-full bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded flex items-center justify-center">
                        View Product
                      </button>
                    </Link>
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
