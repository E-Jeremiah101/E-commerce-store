import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  return (
    <div className="flex-w-full relative flex-col h-full overflow-hidden rounded-lg border-gray-700">
      {/* Product Image */}
      <Link to={`/product/${product._id}`}>
        <div className="relative rounded-1xl mt-3 flex overflow-hidden h-50">
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
        <div className="mt-2 px-2 pb-2 space-y-2 flex flex-col justify-center items-center">
          <h3 className="text-md text-gray-800 mb-1 text-center tracking-wider">
            {product.name}
          </h3>

          <span className="text-md font-light text-gray-900">
            ₦{" "}
            {product.price.toLocaleString(undefined, {
              minimumFractionDigits: 0,
            })}
          </span>

          
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
