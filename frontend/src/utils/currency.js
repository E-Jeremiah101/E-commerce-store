export const formatPrice = (amount, currency = "NGN") => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
};
