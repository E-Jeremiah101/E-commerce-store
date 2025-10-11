
import {Link} from "react-router-dom"

const ProductCard = ({ product }) => {

  

  return (
    <div className="flex-w-full relative flex-col h-full overflow-hidden rounded-lg  border-gray-700 shadow-lg">
      {/* Product Image */}
      
        <div className="relative rounded-1xl mt-3 flex overflow-hidden h-44 ">
          <img
            className="object-cover w-full  "
            src={product.images?.[0]}
            alt={product.name}
          />

          <div className="absolute inset-0 bg-black opacity-10" />
        </div>

        {/* Product Info */}
        <div className="mt-2 px-2 pb-4 space-y-2">
          <h3 className="text-sm font-semibold  tracking-widest text-black h-10 mb-0">
            {product.name}
          </h3>

          <p className="text-lg  text-black font-medium">
            ₦{" "}
            {product.price.toLocaleString(undefined, {
              minimumFractionDigits: 0,
            })}
          </p>
          {/* Add to Cart Button */}
          <Link to={`/product/${product._id}`}>
          <button
            className="w-full mt-3 flex items-center justify-center rounded-lg bg-black px-1 lg:px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-900 tracking-widest"
            
          >
            {/* <ShoppingCart size={22} className="mr-2" /> */}
           View Product
          </button>
          </Link>
        </div>
      
    </div>
  );
};

export default ProductCard;
