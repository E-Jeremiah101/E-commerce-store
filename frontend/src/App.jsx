import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import Navbar from "./components/Navbar.jsx";
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUserStore } from "./stores/useUserStore.js";
import { useCartStore } from "./stores/useCartStore.js";
import useTrackVisitors from "./stores/useTrackVisitors.js";

const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const SignUpPage = lazy(() => import("./pages/SignUpPage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));
const AdminOrderDetails = lazy(() => import("./pages/AdminOrderDetails.jsx"));
const OrderHistoryPage = lazy(() => import("./pages/OrderHistoryPage.jsx"));
const CategoryPage = lazy(() => import("./pages/CategoryPage.jsx"));
const CartPage = lazy(() => import("./pages/CartPage.jsx"));
const PurchaseSuccessPage = lazy(() =>
  import("./pages/PurchaseSuccessPage.jsx")
);
const PurchaseCancelPage = lazy(() => import("./pages/PurchaseCancelPage.jsx"));
const PersonalInfoPage = lazy(() => import("./pages/PersonalInfoPage.jsx"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.jsx"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgetPasswordPage.jsx"));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage.jsx"));
const ViewProductPage = lazy(() => import("./pages/ViewProductPage.jsx"));
const ViewOrderPage = lazy(() => import("./pages/ViewOrderPage.jsx"));
const SavedProductsPage = lazy(() => import("./pages/SavedProductsPage.jsx"));
const RequestReturnPage = lazy(() => import("./pages/RequestReturnPage.jsx"));
const ArchivedProductsList = lazy(() =>
  import("./components/ArchivedProductsList.jsx")
);
const ArchivedAuditLogsTab = lazy(() =>
  import("./components/ArchivedAuditLogsTab.jsx")
);

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
    if (
      location.pathname.startsWith("/reset-password") ||
      location.pathname === "/forgot-password" ||
      location.pathname === "/login" ||
      location.pathname === "/signup"
    ) {
      useUserStore.setState({ checkingAuth: false });
      return;
    }
    checkAuth();
  }, [checkAuth, location.pathname]);

  const { validateCartItems } = useCartStore();

  useEffect(() => {
    validateCartItems();
  }, [validateCartItems]);

  useEffect(() => {
    if (user) {
      startTokenRefreshTimer();
    } else {
      stopTokenRefreshTimer();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getCartItems();
  }, [getCartItems, user]);

  
  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {location.pathname === "/" && <Navbar />}

      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
          </div>
        }
      >
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
            path="/secret-dashboard"
            element={
              user?.role === "admin" ? <AdminPage /> : <Navigate to="/login" />
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
            path="/vieworders/:id/return"
            element={<RequestReturnPage />}
          />
          <Route
            path="Personal-info"
            element={user ? <PersonalInfoPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/purchase-success"
            element={user ? <PurchaseSuccessPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/products/archived-product"
            element={user ? <ArchivedProductsList /> : <Navigate to="/" />}
          />
          <Route
            path="/admin/audit/archived-audit-logs"
            element={user ? <ArchivedAuditLogsTab /> : <Navigate to="/" />}
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
          <Route
            path="/saved"
            element={user ? <SavedProductsPage /> : <Navigate to="/login" />}
          />
          <Route path="/search" element={<SearchResultsPage />} />
        </Routes>
      </Suspense>

      <ToastContainer
        position="top-center"
        autoClose={4000}
        style={{ marginTop: "75px" }}
      />

      <Toaster />
    </>
  );
}

export default App;
