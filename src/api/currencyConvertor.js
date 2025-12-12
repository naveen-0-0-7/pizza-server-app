const intl = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const priceConvertor = (price) => intl.format(price);
export default function useCurrency(price) {
  return priceConvertor(price);
}
