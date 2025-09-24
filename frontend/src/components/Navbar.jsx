import { useState } from "react";
import {
  ShoppingCart,
  UserPlus,
  LogIn,
  LogOut,
  Lock,
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
    <header className="fixed top-0 w-full bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b border-emerald-800">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        {/* <Link
          to={"/"}
          className="text-2xl font-bold text-emerald-400 flex items-center"
        >
          Eco-Sore
        </Link> */}

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-4">
          <Link to={"/"} className="text-gray-300 hover:text-emerald-400">
            Home
          </Link>

          {user && (
            <Link
              to={"/personal-info"}
              className="text-gray-300 hover:text-emerald-400"
            >
              Personal Info
            </Link>
          )}

          {user && (
            <Link
              to={"/order-history"}
              className="text-gray-300 hover:text-emerald-400"
            >
              My Orders
            </Link>
          )}

          {user && (
            <Link
              to={"/cart"}
              className="relative group text-gray-300 hover:text-emerald-400"
            >
              <ShoppingCart
                className="inline-block mr-1 group-hover:text-emerald-400"
                size={20}
              />
              <span className="hidden sm:inline">Cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -left-2 bg-emerald-500 text-white rounded-full px-2 py-0.5 text-xs group-hover:bg-emerald-400">
                  {cart.length}
                </span>
              )}
            </Link>
          )}

          {isAdmin && (
            <Link
              to={"/secret-dashboard"}
              className="bg-emerald-700 text-white hover:bg-emerald-600 px-3 py-1 rounded-md flex items-center"
            >
              <Lock className="inline-block mr-1" size={18} />
              Dashboard
            </Link>
          )}
        </nav>
        <nav className="hidden md:flex items-center gap-4">
          {user ? (
            <button
              onClick={logout}
              className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline ml-2">Log Out</span>
            </button>
          ) : (
            <>
              <Link
                to={"/signup"}
                className="bg-emerald-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md flex items-center"
              >
                <UserPlus className="mr-2" size={18} />
                Sign Up
              </Link>

              <Link
                to={"/login"}
                className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center"
              >
                <LogIn className="mr-2" size={18} />
                Login
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-300 hover:text-emerald-400"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 px-4 py-3 space-y-3">
          <Link
            to={"/"}
            className="block text-gray-300 hover:text-emerald-400"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>

          {user && (
            <Link
              to={"/personal-info"}
              className="block hover:text-emerald-400"
              onClick={() => setIsOpen(false)}
            >
              Personal Info
            </Link>
          )}

          {user && (
            <Link
              to={"/order-history"}
              className="block hover:text-emerald-400"
              onClick={() => setIsOpen(false)}
            >
              My Orders
            </Link>
          )}

          {user && (
            <Link
              to={"/cart"}
              className="block hover:text-emerald-400"
              onClick={() => setIsOpen(false)}
            >
              Cart ({cart.length})
            </Link>
          )}

          {isAdmin && (
            <Link
              to={"/secret-dashboard"}
              className="block hover:text-emerald-400"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
          )}

          {user ? (
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center justify-center"
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
    </header>
  );
};

export default Navbar;
