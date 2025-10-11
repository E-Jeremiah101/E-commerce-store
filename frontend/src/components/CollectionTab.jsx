import React from 'react'
import { Link } from 'react-router-dom';

const CollectionTab = () => {
  return (
    <div className=" hidden md:flex justify-center items-center text-black my-5">
      <ul className="flex flex-wrap justify-center gap-x-7 gap-y-7 px-30 max-w-5xl text-sm  text-center tracking-widest">
        <Link to={"/category/t-shirts"}>
          <span className="hover:text-gray-300">T-SHIRT</span>
        </Link>
        <Link to={"/category/suits&blazer"}>
          <span className="hover:text-gray-300">SUITS & BLAZERS</span>
        </Link>
        <Link to={"/category/underwear&socks"}>
          <span className="hover:text-gray-300">UNDERWEAR & SOCKS</span>
        </Link>
        <Link to={"/category/footwears"}>
          <span className="hover:text-gray-300">FOOTWEAR</span>
        </Link>
        <Link to={"/category/sets"}>
          <span className="hover:text-gray-300">SETS & CO-ORDS</span>
        </Link>

        <Link to={"/category/accessories"}>
          <span className="hover:text-gray-300">ACCESSORIES & Essentials</span>
        </Link>
        <Link to={"/category/bottoms"}>
          <span className="hover:text-gray-300">BOTTOMS</span>
        </Link>
        {/* <Link to={"/category/bags"}>
          <span className="hover:text-gray-300">BAGS</span>
        </Link>
        <Link to={"/category/sportwear"}>
          <span className="hover:text-gray-300">SPORTWEAR</span>
        </Link> */}
        {/* <Link>
                <span className="hover:text-gray-300">ADDIDAS COLLECTION</span>
              </Link> */}
        {/* <Link>
                <span className="hover:text-gray-300">FENDI COLLECTION</span>
              </Link> */}
        {/* <Link>
                <span className="hover:text-gray-300">GUCCI COLLECTION</span>
              </Link> */}
      </ul>
    </div>
  );
}

export default CollectionTab