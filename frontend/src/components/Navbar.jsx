import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  UserPlus,
  LogOut,
  Lock,
  Home,
  User,
  Package,
  Menu,
  X, 
  Heart,
  Search,
  ChevronDown,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore.js";
import { useCartStore } from "../stores/useCartStore.js";
import SearchBar from "./SearchBar.jsx";
import UserBadge from "./UserBadge.jsx";
import { useStoreSettings } from "./StoreSettingsContext.jsx";
import axios from "../lib/axios.js";

const Navbar = () => {
  const { user, logout } = useUserStore();
  const isAdmin = user?.role === "admin";
  const { cart } = useCartStore();
  const navigate = useNavigate();
  const { settings } = useStoreSettings();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [desktopCollectionsOpen, setDesktopCollectionsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const mobileMenuRef = useRef(null);
  const desktopCollectionsRef = useRef(null);
  const mobileCollectionsRef = useRef(null);

  useEffect(() => {
      const fetchCategories = async () => {
        try {
          const res = await axios.get("/categories-with-images");
          setCategories(res.data);
        } catch (error) {
          setCategories([]);
          console.error("Error fetching categories:", error);
        } finally {
          setIsLoadingCategories(false);
        }
      };
      fetchCategories();
    }, []);

  // const categories = [
  //   { name: "Fragrance", path: "/category/Fragrance" },
  //   { name: "T-Shirts", path: "/category/t-shirts" },
  //   { name: "Suits & Blazers", path: "/category/suits&blazers" },
  //   { name: "Jackets & Outerwear", path: "/category/Jackets&Outerwear" },
  //   { name: "Underwear & Socks", path: "/category/underwear&socks" },
  //   { name: "Footwear", path: "/category/footwears" },
  //   { name: "Sets & Co-ords", path: "/category/sets&cords" },
  //   { name: "Accessories", path: "/category/Accessories" },
  //   { name: "Bottoms", path: "/category/bottoms" },
  // ];

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close mobile menu when clicking outside
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }

      // Close desktop collections when clicking outside
      if (
        desktopCollectionsRef.current &&
        !desktopCollectionsRef.current.contains(event.target)
      ) {
        setDesktopCollectionsOpen(false);
      }

      // Close mobile collections when clicking outside
      if (
        mobileCollectionsRef.current &&
        !mobileCollectionsRef.current.contains(event.target) &&
        event.target.closest("[data-collections-button]") === null
      ) {
        setIsCollectionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search toggle for both mobile and desktop
  const handleSearchToggle = () => {
    setIsSearchOpen((prev) => !prev);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen((prev) => !prev);
    if (isSearchOpen) setIsSearchOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  // Close all dropdowns when clicking on a link
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
    setIsCollectionsOpen(false);
    setDesktopCollectionsOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-lg shadow-lg py-2"
            : "bg-white py-3 border-b border-gray-100"
        }`}
      >
        <div className="container mx-auto px-4">
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 group"
              onClick={handleLinkClick}
            >
              {settings?.logo ? (
                <img
                  src={settings.logo}
                  alt={settings.storeName}
                  className="h-10 w-auto transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {settings?.storeName?.charAt(0) || "S"}
                  </span>
                </div>
              )}
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {settings?.storeName || "Store"}
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                onClick={handleLinkClick}
              >
                Home
              </Link>

              {/* Desktop Collections Dropdown */}
              <div className="relative" ref={desktopCollectionsRef}>
                <button
                  onClick={() =>
                    setDesktopCollectionsOpen(!desktopCollectionsOpen)
                  }
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium flex items-center gap-1"
                >
                  Collections
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      desktopCollectionsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {desktopCollectionsOpen && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 grid md:grid-cols-3 lg:grid-cols-3 gap-2 mt-1 w-3xl bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                    {categories.map((category) => (
                      <Link
                        key={category.name}
                        to={`/category/${category.name}`}
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
                        onClick={() => {
                          setDesktopCollectionsOpen(false);
                          handleLinkClick();
                        }}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {user && (
                <>
                  <Link
                    to="/personal-info"
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                    onClick={handleLinkClick}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/order-history"
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                    onClick={handleLinkClick}
                  >
                    Orders
                  </Link>
                </>
              )}

              <Link
                to="/saved"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                onClick={handleLinkClick}
              >
                Wishlist
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Search - FIXED: Now works on desktop */}
              <button
                onClick={handleSearchToggle}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
                aria-label="Search"
              >
                <Search size={20} />
                {isSearchOpen && (
                  <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-x-1/2"></div>
                )}
              </button>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Shopping Cart"
                onClick={handleLinkClick}
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {cart.length}
                  </span>
                )}
              </Link>

              {/* User Actions */}
              {user ? (
                <div className="relative group">
                  <UserBadge
                    name={user.name || `${user.firstname} ${user.lastname}`}
                    size="md"
                    className="cursor-pointer"
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {isAdmin && (
                      <Link
                        to="/secret-dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        onClick={handleLinkClick}
                      >
                        <Lock size={16} />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut size={16} />
                      Log Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                    onClick={handleLinkClick}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                    onClick={handleLinkClick}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button */}
              <button
                onClick={handleMobileMenuToggle}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <X size={24} className="animate-in fade-in" />
                ) : (
                  <Menu size={24} />
                )}
              </button>

              {/* Logo */}
              <Link
                to="/"
                className="flex items-center gap-2"
                onClick={handleLinkClick}
              >
                {settings?.logo ? (
                  <img
                    src={settings.logo}
                    alt={settings.storeName}
                    className="h-8 w-auto"
                  />
                ) : (
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">
                      {settings?.storeName?.charAt(0) || "S"}
                    </span>
                  </div>
                )}
                <span className="font-bold text-gray-900">
                  {settings?.storeName || "Store"}
                </span>
              </Link>

              {/* Mobile Right Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSearchToggle}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
                  aria-label="Search"
                >
                  {isSearchOpen ? (
                    <X size={20} className="animate-in fade-in" />
                  ) : (
                    <Search size={20} />
                  )}
                  {isSearchOpen && (
                    <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-x-1/2"></div>
                  )}
                </button>

                <Link
                  to="/cart"
                  className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Shopping Cart"
                  onClick={handleLinkClick}
                >
                  <ShoppingCart size={20} />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Mobile Search Bar */}
            {isSearchOpen && (
              <div className="mt-3 animate-in slide-in-from-top duration-200">
                <SearchBar onSearch={() => setIsSearchOpen(false)} />
              </div>
            )}
          </div>
        </div>

        {/* Desktop Search Bar - FIXED: Now opens properly */}
        {isSearchOpen && (
          <div className="hidden lg:block animate-in slide-in-from-top duration-200">
            <div className="container mx-auto px-4 py-4 bg-white border-t border-gray-100 shadow-sm">
              <SearchBar onSearch={() => setIsSearchOpen(false)} />
            </div>
          </div>
        )}
      </header>

      {/* Mobile Sidebar Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div
            ref={mobileMenuRef}
            className="fixed inset-y-0 left-0 w-80 bg-white z-50 shadow-2xl animate-in slide-in-from-left duration-300 lg:hidden overflow-y-auto"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                {user ? (
                  <div className="flex items-center gap-3">
                    <UserBadge
                      name={user.name || `${user.firstname} ${user.lastname}`}
                      size="lg"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <UserBadge name="Welcome" size="lg" />
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <div className="flex-1 py-4">
                <nav className="space-y-1">
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    onClick={handleLinkClick}
                  >
                    <Home size={20} />
                    <span className="font-medium">Home</span>
                  </Link>

                  {/* Mobile Collections Accordion */}
                  <div className="px-6" ref={mobileCollectionsRef}>
                    <button
                      data-collections-button
                      onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                      className="flex items-center justify-between w-full py-3 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Package size={20} />
                        <span className="font-medium">Collections</span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          isCollectionsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div
                      className={`overflow-y-scroll transition-all duration-300 ${
                        isCollectionsOpen ? "max-h-96" : "max-h-0"
                      }`}
                    >
                      <div className="pl-5 py-2 space-y-1 no-scroll">
                        {categories.map((category) => (
                          <Link
                            key={category.name}
                            to={`/category/${category.name}`}
                            className="block py-2 px-4 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                            onClick={() => {
                              setIsCollectionsOpen(false);
                              handleLinkClick();
                            }}
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {user && (
                    <>
                      <Link
                        to="/personal-info"
                        className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        onClick={handleLinkClick}
                      >
                        <User size={20} />
                        <span className="font-medium">Profile</span>
                      </Link>
                      <Link
                        to="/order-history"
                        className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        onClick={handleLinkClick}
                      >
                        <Package size={20} />
                        <span className="font-medium">My Orders</span>
                      </Link>
                    </>
                  )}

                  <Link
                    to="/saved"
                    className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    onClick={handleLinkClick}
                  >
                    <Heart size={20} />
                    <span className="font-medium">Wishlist</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/secret-dashboard"
                      className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      onClick={handleLinkClick}
                    >
                      <Lock size={20} />
                      <span className="font-medium">Admin Dashboard</span>
                    </Link>
                  )}
                </nav>
              </div>

              {/* Footer/Auth Actions */}
              <div className="p-6 border-t border-gray-100 space-y-3">
                {!user ? (
                  <>
                    <Link
                      to="/login"
                      className="block w-full text-center py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                      onClick={handleLinkClick}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="block w-full text-center py-3 border-2 border-gray-900 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      onClick={handleLinkClick}
                    >
                      Create Account
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full py-3 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut size={18} />
                    Log Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacer to prevent content from being hidden under fixed navbar */}
      <div
        className={`h-${isSearchOpen ? "32" : "16"} lg:h-${
          isSearchOpen ? "28" : "20"
        }`}
      />
    </>
  );
};

export default Navbar;
