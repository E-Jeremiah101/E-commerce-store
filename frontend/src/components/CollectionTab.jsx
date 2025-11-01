import React from 'react'
import { Link } from 'react-router-dom';

const CollectionTab = () => {
  return (
    <div className=" hidden md:flex justify-center items-center text-black my-5 look">
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
        <Link to={"/category/sets&cords"}>
          <span className="hover:text-gray-300">SETS & CO-ORDS</span>
        </Link>

        <Link to={"/category/accessories&essentials"}>
          <span className="hover:text-gray-300">ACCESSORIES & ESSENTIALS</span>
        </Link>
        <Link to={"/category/bottoms"}>
          <span className="hover:text-gray-300">BOTTOMS</span>
        </Link>
      </ul>
    </div>
  );
}

export default CollectionTab