export const formatPrice = (amount, currency = "NGN") => {
  if (amount == null || isNaN(amount)) return "";

  const locale = currency === "NGN" ? "en-NG" : undefined;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
