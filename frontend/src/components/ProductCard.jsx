import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

const ProductCard = ({ product }) => {
  return (
    <div className="flex-w-full relative flex-col h-full overflow-hidden border-gray-700">
      {/* Product Image */}
      <Link to={`/product/${product._id}`}>
        <div className="relative flex overflow-hidden h-50 rounded-xs">
          <img
            className="object-cover w-full h-full"
            src={product.images?.[0]}
            alt={product.name}
          />

          {/* Dark overlay for better contrast */}
          <div className="absolute inset-0 bg-black opacity-10" />

          {/* Out of Stock Overlay */}
          {product.countInStock === 0 && (
            <div className="absolute top-0 left-0 w-full h-full bg-black/40 bg-opacity-50 flex items-start justify-start p-1">
              <span className="bg-red-600 text-white text-xs  px-2 py-1 rounded shadow-md">
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="mt-1 px-2 pb-1 space-y-2  flex flex-col ">
          <h3 className="text-sm truncate w-45 lg:text-md text-gray-600 mb-1 tracking-wider">
            {product.name}
          </h3>

          <div className="flex justify-between w-full text-gray-900">
            <div className="text-sm lg:text-md text-gray-900">
              ₦{" "}
              {product.price.toLocaleString(undefined, {
                minimumFractionDigits: 0,
              })}
            </div>
            <div>
              <ShoppingCart size={20} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
