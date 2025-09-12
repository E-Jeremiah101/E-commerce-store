import React from 'react';
import { motion } from 'framer-motion';
import { useCartStore } from '../stores/useCartStore';
import { MoveRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrderSummary = () => {


    const {total, subtotal, coupon} = useCartStore();

    const savings = subtotal - total;
    const formattedSubtotal = subtotal.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
    });
    const formattedTotal = total.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
    });
    const formattedSavings = savings.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
    });


  return (
    <motion.div
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xl font-semibold text-emerald-400">Order summary</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-gray-300">
              Original price
            </dt>
            <dt className="text-base font-medium text-white">
              #{formattedSubtotal}
            </dt>
          </dl>

          {savings > 0 && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-gray-300">Savings</dt>
              <dt className="text-base font-medium text-emerald-400">
                #{formattedSavings}
              </dt>
            </dl>
          )}

          {coupon && isCouponApplied && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-gray-300">
                Coupon ({coupon.code})
              </dt>
              <dt className="text-base font-medium text-emerald-400">
                -{coupon.discountPercentage}%
              </dt>
            </dl>
          )}
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-gray-300">Total</dt>
            <dt className="text-base font-medium text-emerald-400">
              #{formattedTotal}
            </dt>
          </dl>
        </div>

        <motion.button
          className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          //   onClick={handleClick}
        >
          Proceed to Checkout
        </motion.button>

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-normal text-gray-400">or</span>
          <Link className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 underline hover:text-emerald-300 hover:no-underline">
            Continue Shopping 
            <MoveRight size={16}/>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default OrderSummary