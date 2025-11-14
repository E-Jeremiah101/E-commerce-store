import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import CartItem from "../components/CartItem";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import OrderSummary from "../components/OrderSummary";
import GiftCouponCard from "../components/GiftCouponCard";
import GoBackButton from "../components/GoBackButton";

const CartPage = () => {
  const { cart } = useCartStore();

  return (
    <>
      <motion.div
        className=" fixed top-0 left-0 right-0 flex z-40 items-center justify-center bg-gradient-to-br from-white via-gray-100 to-gray-300 py-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute left-4 text-black">
          <GoBackButton />
        </div>
        <h2 className="text-2xl font-semibold text-center">Cart</h2>
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
                <OrderSummary />
                <GiftCouponCard />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default CartPage;

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
    <Link
      className="mt-4 rounded-md bg-emerald-500 px-6 py-2 text-white transition-colors hover:bg-emerald-600"
      to="/"
    >
      Start Shopping
    </Link>
  </motion.div>
);
