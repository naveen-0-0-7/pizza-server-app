export default async function getPastOrder(order) {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/past-order/${order}`
  );
  if (!res.ok) {
    throw new Error("not found!");
  }
  const data = res.json();
  return data;
}
