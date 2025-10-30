
import {Link} from "react-router-dom"

const ProductCard = ({ product }) => {

  

  return (
    <div className="flex-w-full relative flex-col h-full overflow-hidden rounded-lg  border-gray-700 ">
      {/* Product Image */}
      <Link to={`/product/${product._id}`}>
        <div className="relative rounded-1xl mt-3 flex overflow-hidden h-50 ">
          <img
            className="object-cover w-full  "
            src={product.images?.[0]}
            alt={product.name}
          />

          <div className="absolute inset-0 bg-black opacity-10" />
        </div>

        {/* Product Info */}
        <div className="mt-2 px-2 pb-2 space-y-2 flex flex-col justify-center align-middle items-center">
          <h3 className="text-lg text-gray-900 mb-1 text-center tracking-wider">
            {product.name}
          </h3>

          <span className="text-lg  text-gray-700 ">
            ₦{" "}
            {product.price.toLocaleString(undefined, {
              minimumFractionDigits: 0,
            })}
          </span>
          {/* Add to Cart Button */}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
