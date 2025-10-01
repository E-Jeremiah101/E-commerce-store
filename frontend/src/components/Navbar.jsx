import { useState } from "react";
import {
  ShoppingCart,
  UserPlus,
  LogIn,
  LogOut,
  Lock,
  Home,
  User,
  UserCircle,
  Package,
  ShoppingBag,
  Menu,
  X,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore.js";
import { useCartStore } from "../stores/useCartStore.js";
import SearchBar from "./SearchBar.jsx";

const Navbar = () => {
  const { user, logout } = useUserStore();
  const isAdmin = user?.role === "admin";
  const { cart } = useCartStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
    <header className="w-full bg-black bg-opacity-90 backdrop-blur-md shadow-lg z-40 border-b border-black ">

      {/* Mobile View */}

      <div className="sm:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Logo */}
          <Link to={"/"} className="flex sm:hidden items-center gap-2">
            <img src="/logo-buz.jpg" alt="Logo" className="h-10 w-auto" />
            <span className="text-emerald-400 font-bold text-xl">BUZ</span>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            {/* Search toggle */}
            <button
              onClick={handleSearchToggle}
              className="text-gray-300 hover:text-gray-400"
            >
              {isSearchOpen ? <X size={24} /> : <Search size={24} />}
            </button>

            {/* Cart */}
            {user && (
              <Link
                to={"/cart"}
                className="relative text-white hover:text-gray-300"
              >
                <ShoppingCart size={22} />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-black rounded-full px-2 text-xs">
                    {cart.length}
                  </span>
                )}
              </Link>
            )}

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
                <Link to={"/signup"} className="text-white hover:text-gray-300">
                  <UserPlus size={22} />
                </Link>
                <Link to={"/login"} className="text-white hover:text-gray-300">
                  <LogIn size={22} />
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={handleMenuToggle}
              className="md:hidden text-gray-300 hover:text-gray-400"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
        {/* SearchBar */}
        {isSearchOpen && (
          <div className="px-4 py-6 bg-black">
            <SearchBar />
          </div>
        )}
        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="md:hidden bg-black px-4 py-3 space-y-3 text-white">
            <Link
              to={"/"}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2"
            >
              <Home /> Home
            </Link>
            {user && (
              <Link
                to={"/personal-info"}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2"
              >
                <User /> Profile
              </Link>
            )}
            {user && (
              <Link
                to={"/order-history"}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2"
              >
                <Package /> Orders
              </Link>
            )}
            {user && (
              <Link
                to={"/cart"}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2"
              >
                <ShoppingBag /> Cart ({cart.length})
              </Link>
            )}
            {isAdmin && (
              <Link
                to={"/secret-dashboard"}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2"
              >
                <UserCircle /> Dashboard
              </Link>
            )}
            {!user && (
              <>
                <Link
                  to={"/signup"}
                  onClick={() => setIsOpen(false)}
                  className="block bg-emerald-600 px-4 py-2 rounded-md text-center"
                >
                  Sign Up
                </Link>
                <Link
                  to={"/login"}
                  onClick={() => setIsOpen(false)}
                  className="block bg-gray-700 px-4 py-2 rounded-md text-center"
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
                className="w-full bg-gray-700 px-4 py-2 rounded-md flex items-center justify-center"
              >
                <LogOut size={18} /> <span className="ml-2">Log Out</span>
              </button>
            )}
          </div>
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
              <span className="text-emerald-400 font-bold text-xl">BUZ</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-white tracking-widest">
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
                  className="text-gray-300 hover:text-gray-400"
                >
                  {isSearchOpen ? <X size={24} /> : <Search size={24} />}
                </button>

                {/* Cart */}
                {user && (
                  <Link
                    to={"/cart"}
                    className="relative text-white hover:text-gray-300"
                  >
                    <ShoppingCart size={22} />
                    {cart.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-white text-black rounded-full px-2 text-xs">
                        {cart.length}
                      </span>
                    )}
                  </Link>
                )}

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
                      to={"/signup"}
                      className="text-white hover:text-gray-300"
                    >
                      <UserPlus size={22} />
                    </Link>
                    <Link
                      to={"/login"}
                      className="text-white hover:text-gray-300"
                    >
                      <LogIn size={22} />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="h-50 hidden md:flex justify-center items-center text-white">
            <ul className="flex flex-wrap justify-center gap-x-7 gap-y-7 px-30 max-w-5xl text-gray-100 text-sm  text-center tracking-widest">
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
                <span className="hover:text-gray-300">ACCESSORIES</span>
              </Link>
              <Link to={"/category/bottoms"}>
                <span className="hover:text-gray-300">BOTTOMS</span>
              </Link>
              <Link to={"/category/bags"}>
                <span className="hover:text-gray-300">BAGS</span>
              </Link>
              <Link>
                <span className="hover:text-gray-300">ADDIDAS COLLECTION</span>
              </Link>
              <Link>
                <span className="hover:text-gray-300">FENDI COLLECTION</span>
              </Link>
              <Link>
                <span className="hover:text-gray-300">GUCCI COLLECTION</span>
              </Link>
            </ul>
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

