export const generateCouponCode = (reason = "special_reward") => {
  const map = {
    first_order: "WELCOME",
    high_value_order: "VIP",
    special_reward: "REWARD",
    loyalty_bonus: "LOYAL",
  };

  const prefix = map[reason] || "SAVE";
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `${prefix}-${random}`;
};
