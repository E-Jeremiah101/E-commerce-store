import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import { motion } from "framer-motion";
import { ShoppingCart, Loader } from "lucide-react";
import { SEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import CartItem from "../components/CartItem";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import OrderSummary from "../components/OrderSummary";
import GiftCouponCard from "../components/GiftCouponCard";
import GoBackButton from "../components/GoBackButton";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

const CartPageContent = () => {
  const { cart, isLoading } = useCartStore();
  const { settings } = useStoreSettings();

  return (
    <>
      <SEO
        title={`Shopping Cart | ${settings?.storeName || "Store"}`}
        description={`Review your shopping cart with ${cart.length} items. Proceed to checkout securely at ${settings?.storeName}.`}
        image={settings?.logo}
        canonicalUrl={window.location.href}
      />
      <motion.div
        className="fixed top-0 left-0 right-0 z-40 bg-white backdrop-blur-md"
        style={{ borderBottom: "none", boxShadow: "none" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Back Button - Left aligned */}
            <div className="flex items-center">
              <motion.div
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <GoBackButton />
              </motion.div>
            </div>

            {/* Page Title - Centered with subtle styling */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="flex flex-col items-center">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
                  Cart
                </h2>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <div className="py-8 md:py-16 mt-7">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <div className=" md:gap-6 lg:flex lg:items-start xl:gap-8">
            <motion.div
              className="mx-auto w-full mt-6 flex-none lg:max-w-2xl xl:max-w-4xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {cart.length === 0 ? (
                <EmptyCartUI />
              ) : isLoading ? (
                <LoadingCartSkeleton />
              ) : (
                <div className="space-y-6">
                  {cart.map((item) => (
                    <CartItem
                      key={`${item._id}-${item.size || "N/A"}-${
                        item.color || "N/A"
                      }`}
                      item={item}
                    />
                  ))}
                </div>
              )}
              {/* {cart.length > 0 && <PeopleAlsoBought />} */}
            </motion.div>

            {cart.length > 0 && (
              <motion.div
                className="mx-auto mt-6 max-w-4xl flex-1 px-1 space-y-6  lg:w-full"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {isLoading ? <LoadingOrderSummarySkeleton /> : <OrderSummary />}
                <GiftCouponCard />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default function CartPage() {
  return (
    <ErrorBoundary>
      <CartPageContent />
    </ErrorBoundary>
  );
}

const EmptyCartUI = () => (
  <motion.div
    className="flex flex-col items-center justify-center space-y-4 py-16"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <ShoppingCart className="h-24 w-24 text-gray-300" />
    <h3 className="text-2xl font-semibold ">Your cart is empty</h3>
    <p className="text-gray-400">
      Looks like you {"haven't"} added anything to your cart yet.
    </p>
    <Link className="mt-4 rounded-md bg-black px-6 py-2 text-white" to="/">
      Start Shopping
    </Link>
  </motion.div>
);

const LoadingCartSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        className="bg-gray-200 rounded-lg h-32 animate-pulse"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    ))}
  </div>
);

const LoadingOrderSummarySkeleton = () => (
  <motion.div
    className="space-y-4"
    initial={{ opacity: 0.6 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1, repeat: Infinity }}
  >
    <div className="bg-white rounded-lg p-6 space-y-4">
      <div className="bg-gray-200 h-6 rounded w-1/2 animate-pulse" />
      <div className="space-y-2">
        <div className="bg-gray-200 h-4 rounded animate-pulse" />
        <div className="bg-gray-200 h-4 rounded w-3/4 animate-pulse" />
      </div>
      <div className="border-t pt-4">
        <div className="bg-gray-200 h-6 rounded w-1/3 animate-pulse" />
      </div>
      <div className="bg-gray-200 h-12 rounded animate-pulse" />
    </div>
  </motion.div>
);
