import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  UserPlus,
  LogOut,
  Lock,
  Home,
  User,
  UserCircle,
  Package,
  Menu,
  X,
  Heart,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore.js";
import { useCartStore } from "../stores/useCartStore.js";
import SearchBar from "./SearchBar.jsx";
import { ChevronUp, ChevronDown } from "lucide-react";
import UserBadge from "./UserBadge.jsx";

const Navbar = () => {
  const { user, logout } = useUserStore();
  const isAdmin = user?.role === "admin";
  const { cart } = useCartStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isOpenn, setIsOpenn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const sidebarRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      } else {
        document.removeEventListener("mousedown", handleClickOutside);
      }

      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

  // Toggle Search
  const handleSearchToggle = () => {
    setIsSearchOpen((prev) => !prev);
    setIsOpen(false); // close menu if search opens
  };

  // Toggle Menu
  const handleMenuToggle = () => {
    setIsOpen((prev) => !prev);
    setIsSearchOpen(false); // close search if menu opens
  };

  return (
    <header className="w-full  bg-gradient-to-br from-white via-gray-50 to-gray-200 bg-opacity-90 backdrop-blur-md shadow-lg  fixed lg:static text-black top-0 left-0 z-40 transition-all duration-300 ">
      {/* Mobile View */}

      <div className="sm:hidden  ">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between ">
          {/* Left: Logo */}
          <Link to={"/"} className="flex sm:hidden items-center gap-2">
            <img
              src="/logo-buz.jpg"
              alt="Logo"
              className="h-10 w-auto rounded-2xl"
            />
            <span className="font-bold text-xl">Eco~Store</span>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-4 ">
            {/* Search toggle */}
            <button
              onClick={handleSearchToggle}
              className="text-gray-800 hover:text-gray-400"
            >
              {isSearchOpen ? <X size={24} /> : <Search size={24} />}
            </button>

            {/* Cart */}

            <Link
              to={"/cart"}
              className="relative text-gray-800 hover:text-gray-400"
            >
              <ShoppingCart size={23} />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white rounded-full px-2 text-xs">
                  {cart.length}
                </span>
              )}
            </Link>

            {/* Auth buttons */}
            {user ? (
              <button
                onClick={logout}
                className="text-white hover:text-gray-300 hidden sm:block"
              >
                <LogOut size={22} />
              </button>
            ) : (
              <>
                <Link
                  to={"/welcome"}
                  className="text-gray-800 hover:text-gray-300"
                >
                  <UserPlus size={22} />
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}

            <button
              onClick={handleMenuToggle}
              className="md:hidden text-gray-800 hover:text-gray-400"
            >
              {isOpen ? <X size={28} className="hidden" /> : <Menu size={28} />}
            </button>
          </div>
        </div>
        {/* SearchBar */}
        {isSearchOpen && (
          <div className="px-4 py-6  bg-gradient-to-br from-white via-gray-100 to-gray-300">
            <SearchBar />
          </div>
        )}
        {/* Mobile Dropdown */}
        {isOpen && (
          <>
            <div
              className="md:hidden   bg-gradient-to-br from-white via-gray-100 to-gray-300 px-4 py-3 space-y-9 text-black  text-lg overflow-y-auto h-screen absolute right-15 top-0 left-0 no-scroll "
              ref={sidebarRef}
            >
              {/* <button
                onClick={handleMenuToggle}
                className="md:hidden text-gray-800 hover:text-gray-400"
              >
                {isOpen ? <X size={24} /> : <Menu size={28} />}
              </button> */}

              {user && (
                <div className="flex items-center justify-between py-3  ">
                  <div className="flex  items-center gap-4 tracking-wider">
                    <UserBadge
                      name={user?.name || user.firstname + " " + user.lastname}
                      size="lg"
                    />
                  </div>
                </div>
              )}
              {!user && (
                <div className="flex items-center justify-between tracking-wider pb-2 ">
                  <div className="flex items-center gap-4">
                    <UserBadge name="Welcome" size="lg" />
                  </div>
                </div>
              )}

              <Link
                to={"/"}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-5 tracking-widest"
              >
                <Home size={19} /> Home
              </Link>

              {user && (
                <Link
                  to={"/personal-info"}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-5 tracking-widest"
                >
                  <User size={19} /> Profile
                </Link>
              )}
              {user && (
                <Link
                  to={"/order-history"}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-5 tracking-widest"
                >
                  <Package size={19} /> My orders
                </Link>
              )}

              <Link
                to={"/saved"}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-5 tracking-widest"
              >
                <Heart size={19} /> Wishlist
              </Link>

              <Link
                to={"/cart"}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-5 tracking-widest"
              >
                <ShoppingCart size={19} /> Cart ({cart.length})
              </Link>

              {isAdmin && (
                <Link
                  to={"/secret-dashboard"}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-5 tracking-widest"
                >
                  <UserCircle size={19} />
                  Admin Dashboard
                </Link>
              )}

              <div className=" border-gray-700 py-3 lg:pr-80  px-4 sm:px-6 ">
                <button
                  onClick={() => setIsOpenn(!isOpenn)}
                  className="flex items-center w-full text-left focus:outline-none"
                >
                  <strong className="text-lg font-bold text-black hover:text-gray-800 transition-colors whitespace-nowrap tracking-widest cursor-pointer">
                    COLLECTIONS
                  </strong>

                  <span className="text-black font-extrabold  ml-2 transition-transform duration-300 h-7 w-7 flex items-center justify-center  cursor-pointer">
                    {isOpenn ? (
                      <ChevronDown size={22} />
                    ) : (
                      <ChevronUp size={22} />
                    )}
                  </span>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpenn ? " mt-2" : "max-h-0"
                  }`}
                >
                  <ul className="text-black list-disc list-inside space-y-4 font-serif">
                    <li>
                      <Link to={"/category/Fragrance"}>
                        <span className="hover:text-gray-700">FRAGRANCE</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={"/category/t-shirts"}>
                        <span className="hover:text-gray-700">T-SHIRT</span>
                      </Link>
                    </li>

                    <li>
                      <Link to={"/category/suits&blazers"}>
                        <span className="hover:text-gray-700">
                          SUITS & BLAZERS
                        </span>
                      </Link>
                    </li>

                    <li>
                      <Link to={"/category/Jackets&Outerwear"}>
                        <span className="hover:text-gray-700">
                          JACKETS & OUTERWEARS
                        </span>
                      </Link>
                    </li>

                    <li>
                      <Link to={"/category/underwear&socks"}>
                        <span className="hover:text-gray-700">
                          UNDERWEAR & SOCKS
                        </span>
                      </Link>
                    </li>

                    <li>
                      <Link to={"/category/footwears"}>
                        <span className="hover:text-gray-700">FOOTWEARS</span>
                      </Link>
                    </li>

                    <li>
                      <Link to={"/category/sets&cords"}>
                        <span className="hover:text-gray-700">
                          SETS & CO-ORDS
                        </span>
                      </Link>
                    </li>

                    <li>
                      <Link to={"/category/Accessories"}>
                        <span className="hover:text-gray-700">ACCESSORIES</span>
                      </Link>
                    </li>

                    <li>
                      <Link to={"/category/bottoms"}>
                        <span className="hover:text-gray-700">BOTTOMS</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {!user && (
                <>
                  <Link
                    to={"/signup"}
                    onClick={() => setIsOpen(false)}
                    className="block bg-gray-500 px-4 py-2 rounded-md text-center"
                  >
                    Sign Up
                  </Link>
                  <Link
                    to={"/login"}
                    onClick={() => setIsOpen(false)}
                    className="block bg-gray-500 px-4 py-2 rounded-md text-center"
                  >
                    Login
                  </Link>
                </>
              )}
              {user && (
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full bg-gray-500 px-4 py-2 rounded-md flex items-center justify-center mb-19 text-white"
                >
                  <LogOut size={18} /> <span className="ml-2">Log Out</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Desktop/Large screen view */}
      {/* //// /// /// //// //// /// // /// // */}
      <div className=" hidden container mx-auto px-4 py-3 sm:block items-center justify-between ">
        {/* Desktop Nav */}
        <div className="hidden sm:block items-center ">
          <div className="flex justify-between items-center">
            {/* Left: Logo */}
            <Link to={"/"} className="flex items-center gap-2">
              <img src="/logo-buz.jpg" alt="Logo" className="h-10 w-auto" />
              <span className=" font-bold text-xl">ECO~STORE</span>
            </Link>

            <nav className=" hidden md:flex items-center gap-6  tracking-widest">
              <Link to={"/"} className="hover:text-gray-300">
                Home
              </Link>
              {user && (
                <Link to={"/personal-info"} className="hover:text-gray-300">
                  Profile
                </Link>
              )}
              {user && (
                <Link to={"/order-history"} className="hover:text-gray-300">
                  Orders
                </Link>
              )}
              <Link
                to={"/saved"}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-5 tracking-widest"
              >
                 Wishlist
              </Link>
              {isAdmin && (
                <Link
                  to={"/secret-dashboard"}
                  className="flex items-center gap-1 hover:text-gray-300"
                >
                  <Lock size={16} /> Dashboard
                </Link>
              )}
            </nav>

            <div>
              <div className="flex items-center gap-4">
                {/* Search toggle */}
                <button
                  onClick={handleSearchToggle}
                  className="text-black hover:text-gray-400"
                >
                  {isSearchOpen ? <X size={24} /> : <Search size={24} />}
                </button>

                {/* Cart */}

                <Link
                  to={"/cart"}
                  className="relative text-black hover:text-gray-300"
                >
                  <ShoppingCart size={22} />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-black text-white rounded-full px-2 text-xs">
                      {cart.length}
                    </span>
                  )}
                </Link>

                {user ? (
                  <button
                    onClick={logout}
                    className="text-black hover:text-gray-300 hidden sm:block"
                  >
                    <LogOut size={22} />
                  </button>
                ) : (
                  <>
                    <Link to={"/welcome"} className="text-black ">
                      <UserPlus size={22} />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* SearchBar */}
      </div>
      {isSearchOpen && (
        <div className="px-4 py-6 bg-black hidden sm:block">
          <SearchBar />
        </div>
      )}
    </header>
  );
};

export default Navbar;
