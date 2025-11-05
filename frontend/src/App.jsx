import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import AdminOrderDetails from "./pages/AdminOrderDetails.jsx";
import OrderHistoryPage from "./pages/OrderHistoryPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import Navbar from "./components/Navbar.jsx";
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUserStore } from "./stores/useUserStore.js";
import { useEffect } from "react";
import CartPage from "./pages/CartPage.jsx";
import { useCartStore } from "./stores/useCartStore.js";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage.jsx";
import PurchaseCancelPage from "./pages/PurchaseCancelPage.jsx";
import PersonalInfoPage from "./pages/PersonalInfoPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import ForgotPasswordPage from "./pages/ForgetPasswordPage.jsx";
import SearchResultsPage from "./pages/SearchResultsPage.jsx";
import ViewProductPage from "./pages/ViewProductPage.jsx";
import Welcome from "./pages/WelcomePage.jsx";
import useTrackVisitors from "./stores/useTrackVisitors.js";
import ViewOrderPage from "./pages/ViewOrderPage.jsx";


function App() {
  useTrackVisitors();
  const {
    user,
    checkAuth,
    checkingAuth,
    startTokenRefreshTimer,
    stopTokenRefreshTimer,
  } = useUserStore();
  const { getCartItems } = useCartStore();
  const location = useLocation();
  useEffect(() => {
    // don't run auth check on reset/forgot password, login, or signup routes
    if (
      location.pathname.startsWith("/reset-password") ||
      location.pathname === "/forgot-password" ||
      location.pathname === "/login" ||
      location.pathname === "/signup" 
    ) {
      // Set checkingAuth to false so spinner doesn't show
      useUserStore.setState({ checkingAuth: false });
      return;
    }
    checkAuth();
  }, [checkAuth, location.pathname]);

  

  useEffect(() => {
    if (user) {
      startTokenRefreshTimer();
    }else{
      stopTokenRefreshTimer();
    }
    
  }, [ user]);

  // localStorage.removeItem("visitorLogged");


  useEffect(() => {
    if (!user) return;
    getCartItems();
  }, [getCartItems, user]);

  if (checkingAuth)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-300  text-black  relative overflow-hidden ">
        {/*Background gradient */}

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full " />
          </div>
        </div>

        {/* {the app content} */}
        <div className="relative z-50 ">
          {location.pathname === "/" && <Navbar />}

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/signup"
              element={!user ? <SignUpPage /> : <Navigate to="/" />}
            />
            <Route
              path="/login"
              element={!user ? <LoginPage /> : <Navigate to="/" />}
            />
            <Route
              path="/welcome"
              element={!user ? <Welcome /> : <Navigate to="/" />}
            />
            <Route
              path="/secret-dashboard"
              element={
                user?.role === "admin" ? (
                  <AdminPage />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/product/:id" element={<ViewProductPage />} />
            <Route path="/cart" element={<CartPage />} />

            <Route
              path="/order-history"
              element={user ? <OrderHistoryPage /> : <Navigate to="/login" />}
            />
            <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />

            <Route path="/vieworders/:id" element={<ViewOrderPage />} />

            <Route
              path="Personal-info"
              element={user ? <PersonalInfoPage /> : <Navigate to="/login" />}
            />

            <Route
              path="/purchase-success"
              element={
                user ? <PurchaseSuccessPage /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/purchase-cancel"
              element={user ? <PurchaseCancelPage /> : <Navigate to="/login" />}
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/reset-password/:token"
              element={<ResetPasswordPage />}
            />
            <Route path="/search" element={<SearchResultsPage />} />
          </Routes>

          <ToastContainer
                    position="top-center"
                    autoClose={4000}
                    style={{ marginTop: "75px" }}
                  />
        </div>
        <Toaster />
      </div>
    </>
  );
}

export default App;
