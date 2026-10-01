import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
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
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore.js";
import { useCartStore } from "../stores/useCartStore.js";
import SearchBar from "./SearchBar.jsx";
import UserBadge from "./UserBadge.jsx";
import { useStoreSettings } from "./StoreSettingsContext.jsx";
import axios from "../lib/axios.js";



const NavLink = ({ to, children, onClick }) => {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? "text-neutral-900 bg-neutral-100"
          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
      }`}
    >
      {children}
    </Link>
  );
};

const IconButton = ({ label, onClick, children, badgeCount = 0 }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
  >
    {children}
    {badgeCount > 0 && (
      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-neutral-900 text-white text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-white">
        {badgeCount > 99 ? "99+" : badgeCount}
      </span>
    )}
  </button>
);



const Navbar = () => {
  const { user, logout } = useUserStore();
  const isAdmin = user?.role === "admin";
  const { cart } = useCartStore();
  const navigate = useNavigate();
  const { settings } = useStoreSettings();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [desktopCollectionsOpen, setDesktopCollectionsOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const mobileMenuRef = useRef(null);
  const desktopCollectionsRef = useRef(null);

  /* Fetch categories */
  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/categories-with-images");
        if (!cancelled) setCategories(res.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Scroll state */
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Close on outside click */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
      if (
        desktopCollectionsRef.current &&
        !desktopCollectionsRef.current.contains(event.target)
      ) {
        setDesktopCollectionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    if (isMobileMenuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isMobileMenuOpen]);

  /* Escape closes menu */
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setDesktopCollectionsOpen(false);
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const handleSearchToggle = () => {
    setIsSearchOpen((p) => !p);
    setIsMobileMenuOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen((p) => !p);
    setIsSearchOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
    setDesktopCollectionsOpen(false);
  };

  const cartCount = cart?.length || 0;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md transition-[border-color,box-shadow] duration-200 ${
          isScrolled
            ? "border-b border-neutral-200 shadow-sm"
            : "border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ---------- Desktop ---------- */}
          <div className="hidden lg:flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 flex-shrink-0"
              onClick={handleLinkClick}
            >
              {settings?.logo ? (
                <img
                  src={settings.logo}
                  alt={settings.storeName}
                  className="h-8 w-auto rounded-2xl"
                />
              ) : (
                <div className="h-8 w-8 rounded-md bg-neutral-900 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {settings?.storeName?.charAt(0) || "S"}
                  </span>
                </div>
              )}
              <span className="text-base font-semibold tracking-tight text-neutral-900">
                {settings?.storeName || ""}
              </span>
            </Link>

            {/* Primary nav */}
            <nav className="flex items-center gap-1">
              <NavLink to="/" onClick={handleLinkClick}>
                Home
              </NavLink>

              {/* Collections dropdown */}
              <div className="relative" ref={desktopCollectionsRef}>
                <button
                  onClick={() => setDesktopCollectionsOpen((p) => !p)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                    desktopCollectionsOpen
                      ? "text-neutral-900 bg-neutral-100"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  Collections
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      desktopCollectionsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {desktopCollectionsOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[560px] bg-white rounded-xl border border-neutral-200 shadow-lg p-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    {categories.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-neutral-500 text-center">
                        No collections yet
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-1">
                        {categories.map((category) => (
                          <Link
                            key={category.name}
                            to={`/category/${category.name}`}
                            className="block px-3 py-2.5 text-sm text-neutral-700 rounded-md hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                            onClick={handleLinkClick}
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {user && (
                <>
                  <NavLink to="/personal-info" onClick={handleLinkClick}>
                    Profile
                  </NavLink>
                  <NavLink to="/order-history" onClick={handleLinkClick}>
                    Orders
                  </NavLink>
                </>
              )}

              <NavLink to="/saved" onClick={handleLinkClick}>
                Wishlist
              </NavLink>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1">
              <IconButton label="Search" onClick={handleSearchToggle}>
                <Search size={18} />
              </IconButton>

              <Link
                to="/cart"
                aria-label="Cart"
                onClick={handleLinkClick}
                className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-neutral-900 text-white text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="relative group ml-1">
                  <button className="flex items-center rounded-full ring-1 ring-neutral-200 hover:ring-neutral-300 transition-all">
                    <UserBadge
                      name={user.name || `${user.firstname} ${user.lastname}`}
                      size="md"
                    />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-neutral-200 shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                    {isAdmin && (
                      <Link
                        to="/secret-dashboard"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                        onClick={handleLinkClick}
                      >
                        <Lock size={15} />
                        Admin dashboard
                      </Link>
                    )}
                    <div className="h-px bg-neutral-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors text-left"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-1">
                  <Link
                    to="/login"
                    onClick={handleLinkClick}
                    className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 rounded-md transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={handleLinkClick}
                    className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ---------- Mobile top bar ---------- */}
          <div className="lg:hidden flex items-center justify-between h-14">
            <IconButton label="Menu" onClick={handleMobileMenuToggle}>
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </IconButton>

            <Link
              to="/"
              className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2"
              onClick={handleLinkClick}
            >
              {settings?.logo ? (
                <img
                  src={settings.logo}
                  alt={settings.storeName}
                  className="h-7 w-auto rounded-2xl"
                />
              ) : (
                <div className="h-7 w-7 rounded-md bg-neutral-900 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {settings?.storeName?.charAt(0) || "S"}
                  </span>
                </div>
              )}
              <span className="text-sm font-semibold tracking-tight text-neutral-900">
                {settings?.storeName || ""}
              </span>
            </Link>

            <div className="flex items-center gap-1">
              <IconButton label="Search" onClick={handleSearchToggle}>
                {isSearchOpen ? <X size={18} /> : <Search size={18} />}
              </IconButton>
              <Link
                to="/cart"
                aria-label="Cart"
                onClick={handleLinkClick}
                className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-neutral-900 text-white text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile search bar */}
          {isSearchOpen && (
            <div className="lg:hidden pb-3 animate-in fade-in slide-in-from-top-1 duration-150">
              <SearchBar onSearch={() => setIsSearchOpen(false)} />
            </div>
          )}

          {/* Desktop search bar */}
          {isSearchOpen && (
            <div className="hidden lg:block pb-4 animate-in fade-in slide-in-from-top-1 duration-150">
              <SearchBar onSearch={() => setIsSearchOpen(false)} />
            </div>
          )}
        </div>
      </header>

      {/* ---------- Mobile drawer ---------- */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-150"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside
            ref={mobileMenuRef}
            className="fixed inset-y-0 left-0 w-[300px] bg-white z-50 shadow-xl animate-in slide-in-from-left duration-200 lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-end px-5 h-14 border-b border-neutral-200">
              <IconButton
                label="Close menu"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={20} />
              </IconButton>
            </div>

            {/* User block */}
            <div className="px-5 py-4 border-b border-neutral-200">
              {user ? (
                <div className="flex items-center gap-3">
                  <UserBadge
                    name={user.name || `${user.firstname} ${user.lastname}`}
                    size="lg"
                  />
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  Welcome. Sign in to track orders and save items.
                </p>
              )}
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-2">
              <MobileNavItem to="/" icon={Home} onClick={handleLinkClick}>
                Home
              </MobileNavItem>

              <MobileCollections
                categories={categories}
                onNavigate={handleLinkClick}
              />

              {user && (
                <>
                  <MobileNavItem
                    to="/personal-info"
                    icon={User}
                    onClick={handleLinkClick}
                  >
                    Profile
                  </MobileNavItem>
                  <MobileNavItem
                    to="/order-history"
                    icon={Package}
                    onClick={handleLinkClick}
                  >
                    My orders
                  </MobileNavItem>
                </>
              )}

              <MobileNavItem to="/saved" icon={Heart} onClick={handleLinkClick}>
                Wishlist
              </MobileNavItem>

              {isAdmin && (
                <MobileNavItem
                  to="/secret-dashboard"
                  icon={Lock}
                  onClick={handleLinkClick}
                >
                  Admin dashboard
                </MobileNavItem>
              )}

              {/* About us */}
              <div className=" border-t border-neutral-200  px-5 py-3.5 text-sm flex-2 font-medium ">
                <div className="py-3 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 ">
                  <Link to={"/about-us"}>About Us</Link>
                </div>

                <div className="py-3 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 ">
                  <Link to={"/contact-us"}>Contact Support</Link>
                </div>
              </div>
            </nav>

            {/* Footer actions */}
            <div className="p-5 border-t border-neutral-200 space-y-2">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    onClick={handleLinkClick}
                    className="block w-full text-center py-2.5 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={handleLinkClick}
                    className="block w-full text-center py-2.5 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition-colors"
                  >
                    Create account
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Spacer for fixed header */}
      <div className="h-14 lg:h-16" />
    </>
  );
};

/* ---------- Mobile sub-components ---------- */

const MobileNavItem = ({ to, icon: Icon, children, onClick }) => {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-neutral-100 text-neutral-900"
          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
      }`}
    >
      <Icon size={18} />
      {children}
    </Link>
  );
};

const MobileCollections = ({ categories, onNavigate }) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
      >
        <span className="flex items-center gap-3">
          <Package size={18} />
          Collections
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-[max-height] duration-200 ${
          open ? "max-h-96 overflow-y-auto" : "max-h-0"
        }`}
      >
        <div className="py-1">
          {categories.length === 0 ? (
            <p className="px-5 py-2 text-xs text-neutral-500">
              No collections yet
            </p>
          ) : (
            categories.map((category) => (
              <Link
                key={category.name}
                to={`/category/${category.name}`}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className="block pl-14 pr-5 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
              >
                {category.name}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;