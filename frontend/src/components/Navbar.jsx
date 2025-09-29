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
} from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore.js";
import { useCartStore } from "../stores/useCartStore.js";

const Navbar = () => {
  const { user, logout } = useUserStore();
  const isAdmin = user?.role === "admin";
  const { cart } = useCartStore();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full bg-black bg-opacity-90 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b border-black">
      <div className="container mx-auto px-4 py-3 flex justify-center items-center ">
        {/* Logo */}
        <Link
          to={"/"}
          className="text-2xl font-bold text-emerald-400 flex items-center"
        >
          <img src="/logo-buz.jpg" alt="" className="h-30" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex justify-between gap-4">
          <Link
            to={"/"}
            className="text-white hover:text-gray-300 tracking-widest"
          >
            Home
          </Link>

          {user && (
            <Link
              to={"/personal-info"}
              className="text-white hover:text-gray-300 tracking-widest"
            >
              Profile
            </Link>
          )}

          {user && (
            <Link
              to={"/order-history"}
              className="text-white hover:text-gray-300 tracking-widest"
            >
              Orders
            </Link>
          )}

          {user && (
            <Link
              to={"/cart"}
              className="relative group text-white hover:text-gray-300"
            >
              <ShoppingCart
                className="inline-block mr-1 group-hover:text-gray-300"
                size={20}
              />
              <span className="hidden sm:inline tracking-widest">Cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -left-2 bg-white text-black rounded-full px-2 py-0.5 text-xs group-hover:bg-gray-300">
                  {cart.length}
                </span>
              )}
            </Link>
          )}

          {isAdmin && (
            <Link
              to={"/secret-dashboard"}
              className=" text-white hover:bg-gray-600 px-3 py-1 rounded-md border flex items-center tracking-widest "
            >
              <Lock className="inline-block mr-1 racking-widest" size={18} />
              Dashboard
            </Link>
          )}
        </nav>

        <nav className="hidden md:flex items-center gap-4">
          {user ? (
            <button
              onClick={logout}
              className="text-white py-2 px-4 rounded-md flex items-center"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <>
              <Link
                to={"/signup"}
                className=" text-white py-2 px-4 rounded-md flex items-center"
              >
                <UserPlus className="mr-2" size={22} />
              </Link>

              <Link
                to={"/login"}
                className=" text-white py-2 px-4 rounded-md flex items-center"
              >
                <LogIn className="mr-2" size={22} />
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-300 hover:text-gray-400"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-black px-4 py-3 space-y-3">
          <Link
            to={"/"}
            className="flex items-center gap-2 text-xl text-white hover:text-gray-300 hover:text-3xl mb-7 transition-all
            duration-600
            "
            onClick={() => setIsOpen(false)}
          >
            <Home className="inline-block" />
            <span>Home</span>
          </Link>

          {user && (
            <Link
              to={"/personal-info"}
              className="flex items-center gap-2 text-xl text-white hover:text-gray-300 hover:text-3xl mb-7 transition-all
            duration-600"
              onClick={() => setIsOpen(false)}
            >
              <User className="inline-block" />
              <span>Profile</span>
            </Link>
          )}

          {user && (
            <Link
              to={"/order-history"}
              className="flex items-center gap-2 text-xl text-white hover:text-gray-300 hover:text-3xl mb-7 transition-all
            duration-600"
              onClick={() => setIsOpen(false)}
            >
              <Package className="inline-block" />
              <span>Orders</span>
            </Link>
          )}

          {user && (
            <Link
              to={"/cart"}
              className="flex items-center gap-2 text-xl text-white hover:text-gray-300 hover:text-3xl mb-7 transition-all
            duration-600"
              onClick={() => setIsOpen(false)}
            >
              <ShoppingBag className="inline-block" />
              <span>Cart</span> ({cart.length})
            </Link>
          )}

          {isAdmin && (
            <Link
              to={"/secret-dashboard"}
              className="flex items-center gap-2 text-xl text-white hover:text-gray-300 hover:text-3xl mb-7 transition-all
            duration-600"
              onClick={() => setIsOpen(false)}
            >
              <UserCircle className="inline-block" />
              <span>Dashboard</span>
            </Link>
          )}

          {user ? (
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full bg-gray-700 text-xl hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center justify-center"
            >
              <LogOut size={18} />
              <span className="ml-2">Log Out</span>
            </button>
          ) : (
            <>
              <Link
                to={"/signup"}
                className="block bg-emerald-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-center"
                onClick={() => setIsOpen(false)}
              >
                Sign Up
              </Link>

              <Link
                to={"/login"}
                className="block bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md text-center"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            </>
          )}
        </div>
      )}

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
    </header>
  );
};

export default Navbar;
