// import { useState, useEffect, useRef } from "react";
// import {
//   ShoppingCart,
//   LogOut,
//   Lock,
//   Home,
//   User,
//   Package,
//   Menu,
//   X,
//   Heart,
//   Search,
//   ChevronDown,
// } from "lucide-react";
// import { Link, useNavigate } from "react-router-dom";
// import { useUserStore } from "../stores/useUserStore.js";
// import { useCartStore } from "../stores/useCartStore.js";
// import SearchBar from "./SearchBar.jsx";
// import UserBadge from "./UserBadge.jsx";
// import { useStoreSettings } from "./StoreSettingsContext.jsx";
// import axios from "../lib/axios.js";

// const Navbar = () => {
//   const { user, logout } = useUserStore();
//   const isAdmin = user?.role === "admin";
//   const { cart } = useCartStore();
//   const navigate = useNavigate();
//   const { settings } = useStoreSettings();

//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
//   const [isSearchOpen, setIsSearchOpen] = useState(false);
//   const [isScrolled, setIsScrolled] = useState(false);
//   const [desktopCollectionsOpen, setDesktopCollectionsOpen] = useState(false);
//   const [categories, setCategories] = useState([]);
//   const [isLoadingCategories, setIsLoadingCategories] = useState(true);

//   const mobileMenuRef = useRef(null);
//   const desktopCollectionsRef = useRef(null);
//   const mobileCollectionsRef = useRef(null);

//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await axios.get("/categories-with-images");
//         setCategories(res.data);
//       } catch (error) {
//         setCategories([]);
//         console.error("Error fetching categories:", error);
//       } finally {
//         setIsLoadingCategories(false);
//       }
//     };
//     fetchCategories();
//   }, []);

//   // Handle scroll effect
//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 10);
//     };
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   // Close dropdowns when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       // Close mobile menu when clicking outside
//       if (
//         mobileMenuRef.current &&
//         !mobileMenuRef.current.contains(event.target)
//       ) {
//         setIsMobileMenuOpen(false);
//       }

//       // Close desktop collections when clicking outside
//       if (
//         desktopCollectionsRef.current &&
//         !desktopCollectionsRef.current.contains(event.target)
//       ) {
//         setDesktopCollectionsOpen(false);
//       }

//       // Close mobile collections when clicking outside
//       if (
//         mobileCollectionsRef.current &&
//         !mobileCollectionsRef.current.contains(event.target) &&
//         event.target.closest("[data-collections-button]") === null
//       ) {
//         setIsCollectionsOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Handle search toggle for both mobile and desktop
//   const handleSearchToggle = () => {
//     setIsSearchOpen((prev) => !prev);
//     if (isMobileMenuOpen) setIsMobileMenuOpen(false);
//   };

//   // Handle mobile menu toggle
//   const handleMobileMenuToggle = () => {
//     setIsMobileMenuOpen((prev) => !prev);
//     if (isSearchOpen) setIsSearchOpen(false);
//   };

//   // Handle logout
//   const handleLogout = () => {
//     logout();
//     navigate("/");
//     setIsMobileMenuOpen(false);
//   };

//   // Close all dropdowns when clicking on a link
//   const handleLinkClick = () => {
//     setIsMobileMenuOpen(false);
//     setIsCollectionsOpen(false);
//     setDesktopCollectionsOpen(false);
//   };

//   return (
//     <>
//       <header
//         className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
//           isScrolled
//             ? "bg-white/95 backdrop-blur-lg shadow-lg py-2"
//             : "bg-white py-3 border-b border-gray-100"
//         }`}
//       >
//         <div className="container mx-auto px-4">
//           {/* Desktop Navigation */}
//           <div className="hidden lg:flex items-center justify-between">
//             {/* Logo */}
//             <Link
//               to="/"
//               className="flex items-center gap-3 group"
//               onClick={handleLinkClick}
//             >
//               {settings?.logo ? (
//                 <img
//                   src={settings.logo}
//                   alt={settings.storeName}
//                   className="h-10 w-auto transition-transform group-hover:scale-105"
//                 />
//               ) : (
//                 <div className="h-10 w-10  flex items-center justify-center">
//                   <span className="text-white font-bold text-lg">
//                     {settings?.storeName?.charAt(0) || ""}
//                   </span>
//                 </div>
//               )}
//               <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
//                 {settings?.storeName || ""}
//               </span>
//             </Link>

//             {/* Navigation Links */}
//             <nav className="flex items-center gap-1">
//               <Link
//                 to="/"
//                 className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
//                 onClick={handleLinkClick}
//               >
//                 Home
//               </Link>

//               {/* Desktop Collections Dropdown */}
//               <div className="relative" ref={desktopCollectionsRef}>
//                 <button
//                   onClick={() =>
//                     setDesktopCollectionsOpen(!desktopCollectionsOpen)
//                   }
//                   className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium flex items-center gap-1"
//                 >
//                   Collections
//                   <ChevronDown
//                     size={16}
//                     className={`transition-transform duration-200 ${
//                       desktopCollectionsOpen ? "rotate-180" : ""
//                     }`}
//                   />
//                 </button>
//                 {desktopCollectionsOpen && (
//                   <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-[600px] bg-white rounded-xl shadow-2xl border border-gray-100 py-4 z-50 animate-in slide-in-from-top-2 duration-200">
//                     <div className="grid grid-cols-3 gap-4 px-4">
//                       {categories.map((category) => (
//                         <Link
//                           key={category.name}
//                           to={`/category/${category.name}`}
//                           className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium text-center shadow-sm"
//                           onClick={() => {
//                             setDesktopCollectionsOpen(false);
//                             handleLinkClick();
//                           }}
//                         >
//                           {category.name}
//                         </Link>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {user && (
//                 <>
//                   <Link
//                     to="/personal-info"
//                     className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
//                     onClick={handleLinkClick}
//                   >
//                     Profile
//                   </Link>
//                   <Link
//                     to="/order-history"
//                     className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
//                     onClick={handleLinkClick}
//                   >
//                     My Orders
//                   </Link>
//                 </>
//               )}

//               <Link
//                 to="/saved"
//                 className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
//                 onClick={handleLinkClick}
//               >
//                 Wishlist
//               </Link>
//             </nav>

//             {/* Right Actions */}
//             <div className="flex items-center gap-3">
//               {/* Search */}
//               <button
//                 onClick={handleSearchToggle}
//                 className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
//                 aria-label="Search"
//               >
//                 <Search size={20} />
//                 {isSearchOpen && (
//                   <div className="absolute -bottom-1 left-1/2 w-2 h-2 -translate-x-1/2"></div>
//                 )}
//               </button>

//               {/* Cart */}
//               <Link
//                 to="/cart"
//                 className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
//                 aria-label="Shopping Cart"
//                 onClick={handleLinkClick}
//               >
//                 <ShoppingCart size={20} />
//                 {cart.length > 0 && (
//                   <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
//                     {cart.length}
//                   </span>
//                 )}
//               </Link>

//               {/* User Actions */}
//               {user ? (
//                 <div className="relative group">
//                   <UserBadge
//                     name={user.name || `${user.firstname} ${user.lastname}`}
//                     size="md"
//                     className="cursor-pointer"
//                   />
//                   <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
//                     {isAdmin && (
//                       <Link
//                         to="/secret-dashboard"
//                         className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
//                         onClick={handleLinkClick}
//                       >
//                         <Lock size={16} />
//                         Admin Dashboard
//                       </Link>
//                     )}
//                     <button
//                       onClick={handleLogout}
//                       className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-left"
//                     >
//                       <LogOut size={16} />
//                       Log Out
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="flex items-center gap-2">
//                   <Link
//                     to="/login"
//                     className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
//                     onClick={handleLinkClick}
//                   >
//                     Sign In
//                   </Link>
//                   <Link
//                     to="/signup"
//                     className="px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-lg hover:shadow-lg transition-all font-medium"
//                     onClick={handleLinkClick}
//                   >
//                     Sign Up
//                   </Link>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Mobile Navigation */}
//           <div className="lg:hidden">
//             <div className="flex items-center justify-between">
//               {/* Mobile Menu Button */}
//               <button
//                 onClick={handleMobileMenuToggle}
//                 className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
//                 aria-label="Menu"
//               >
//                 {isMobileMenuOpen ? (
//                   <X size={24} className="animate-in fade-in" />
//                 ) : (
//                   <Menu size={24} />
//                 )}
//               </button>

//               {/* Logo */}
//               <Link
//                 to="/"
//                 className="flex items-center gap-2"
//                 onClick={handleLinkClick}
//               >
//                 {settings?.logo ? (
//                   <img
//                     src={settings.logo}
//                     alt={settings.storeName}
//                     className="h-8 w-auto"
//                   />
//                 ) : (
//                   <div className="h-8 w-8  rounded-lg flex items-center justify-center">
//                     <span className="text-white font-bold">
//                       {settings?.storeName?.charAt(0) || ""}
//                     </span>
//                   </div>
//                 )}
//                 <span className="font-bold text-gray-900">
//                   {settings?.storeName || ""}
//                 </span>
//               </Link>

//               {/* Mobile Right Actions */}
//               <div className="flex items-center gap-2">
//                 <button
//                   onClick={handleSearchToggle}
//                   className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
//                   aria-label="Search"
//                 >
//                   {isSearchOpen ? (
//                     <X size={20} className="animate-in fade-in" />
//                   ) : (
//                     <Search size={20} />
//                   )}
//                   {isSearchOpen && (
//                     <div className="absolute "></div>
//                   )}
//                 </button>

//                 <Link
//                   to="/cart"
//                   className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
//                   aria-label="Shopping Cart"
//                   onClick={handleLinkClick}
//                 >
//                   <ShoppingCart size={20} />
//                   {cart.length > 0 && (
//                     <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
//                       {cart.length}
//                     </span>
//                   )}
//                 </Link>
//               </div>
//             </div>

//             {/* Mobile Search Bar */}
//             {isSearchOpen && (
//               <div className="mt-3 animate-in slide-in-from-top duration-200">
//                 <SearchBar onSearch={() => setIsSearchOpen(false)} />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Desktop Search Bar - Now opens properly */}
//         {isSearchOpen && (
//           <div className="hidden lg:block animate-in slide-in-from-top duration-200">
//             <div className="container mx-auto px-4 py-4 bg-white border-t border-gray-100 shadow-sm">
//               <SearchBar onSearch={() => setIsSearchOpen(false)} />
//             </div>
//           </div>
//         )}
//       </header>

//       {/* Mobile Sidebar Menu */}
//       {isMobileMenuOpen && (
//         <>
//           {/* Backdrop */}
//           <div
//             className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in"
//             onClick={() => setIsMobileMenuOpen(false)}
//           />

//           {/* Sidebar */}
//           <div
//             ref={mobileMenuRef}
//             className="fixed inset-y-0 left-0 w-80 bg-white z-50 shadow-2xl animate-in slide-in-from-left duration-300 lg:hidden overflow-y-auto"
//           >
//             <div className="h-full flex flex-col">
//               {/* Header */}
//               <div className="p-6 border-b border-gray-100">
//                 {user ? (
//                   <div className="flex items-center gap-3">
//                     <UserBadge
//                       name={user.name || `${user.firstname} ${user.lastname}`}
//                       size="lg"
//                     />
//                   </div>
//                 ) : (
//                   <div className="flex items-center gap-3">
//                     <UserBadge name="Welcome" size="lg" />
//                   </div>
//                 )}
//               </div>

//               {/* Menu Items */}
//               <div className="flex-1 py-4">
//                 <nav className="space-y-1">
//                   <Link
//                     to="/"
//                     className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
//                     onClick={handleLinkClick}
//                   >
//                     <Home size={20} />
//                     <span className="font-medium">Home</span>
//                   </Link>

//                   {/* Mobile Collections Accordion */}
//                   <div className="px-6" ref={mobileCollectionsRef}>
//                     <button
//                       data-collections-button
//                       onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
//                       className="flex items-center justify-between w-full py-3 text-gray-700 hover:text-gray-900 transition-colors"
//                     >
//                       <div className="flex items-center gap-3">
//                         <Package size={20} />
//                         <span className="font-medium">Collections</span>
//                       </div>
//                       <ChevronDown
//                         size={16}
//                         className={`transition-transform duration-200 ${
//                           isCollectionsOpen ? "rotate-180" : ""
//                         }`}
//                       />
//                     </button>

//                     <div
//                       className={`overflow-y-scroll transition-all duration-300 ${
//                         isCollectionsOpen ? "max-h-96" : "max-h-0"
//                       }`}
//                     >
//                       <div className="pl-5 py-2 space-y-1 no-scroll">
//                         {categories.map((category) => (
//                           <Link
//                             key={category.name}
//                             to={`/category/${category.name}`}
//                             className="block py-2 px-4 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
//                             onClick={() => {
//                               setIsCollectionsOpen(false);
//                               handleLinkClick();
//                             }}
//                           >
//                             {category.name}
//                           </Link>
//                         ))}
//                       </div>
//                     </div>
//                   </div>

//                   {user && (
//                     <>
//                       <Link
//                         to="/personal-info"
//                         className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
//                         onClick={handleLinkClick}
//                       >
//                         <User size={20} />
//                         <span className="font-medium">Profile</span>
//                       </Link>
//                       <Link
//                         to="/order-history"
//                         className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
//                         onClick={handleLinkClick}
//                       >
//                         <Package size={20} />
//                         <span className="font-medium">My Orders</span>
//                       </Link>
//                     </>
//                   )}

//                   <Link
//                     to="/saved"
//                     className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
//                     onClick={handleLinkClick}
//                   >
//                     <Heart size={20} />
//                     <span className="font-medium">Wishlist</span>
//                   </Link>

//                   {isAdmin && (
//                     <Link
//                       to="/secret-dashboard"
//                       className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
//                       onClick={handleLinkClick}
//                     >
//                       <Lock size={20} />
//                       <span className="font-medium">Admin Dashboard</span>
//                     </Link>
//                   )}
//                 </nav>
//               </div>

//               {/* Footer/Auth Actions */}
//               <div className="p-6 border-t border-gray-100 space-y-3">
//                 {!user ? (
//                   <>
//                     <Link
//                       to="/login"
//                       className="block w-full text-center py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-lg font-medium hover:shadow-lg transition-all"
//                       onClick={handleLinkClick}
//                     >
//                       Sign In
//                     </Link>
//                     <Link
//                       to="/signup"
//                       className="block w-full text-center py-3 border-2 border-gray-900 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors"
//                       onClick={handleLinkClick}
//                     >
//                       Create Account
//                     </Link>
//                   </>
//                 ) : (
//                   <button
//                     onClick={handleLogout}
//                     className="flex items-center justify-center gap-2 w-full py-3 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
//                   >
//                     <LogOut size={18} />
//                     Log Out
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         </>
//       )}

//       {/* Spacer to prevent content from being hidden under fixed navbar */}
//       <div
//         className={`h-${isSearchOpen ? "32" : "16"} lg:h-${
//           isSearchOpen ? "28" : "20"
//         }`}
//       />
//     </>
//   );
// };

// export default Navbar;

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
                  className="h-8 w-auto"
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
                  className="h-7 w-auto"
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
            <div className="flex items-center justify-between px-5 h-14 border-b border-neutral-200">
              <span className="text-sm font-semibold tracking-tight text-neutral-900">
                Menu
              </span>
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
      className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
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