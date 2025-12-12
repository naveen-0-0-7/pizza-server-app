export default async function getPastOrder(order) {
  const res = await fetch(`/api/past-order/${order}`);
  if (!res.ok) {
    throw new Error("not found!");
  }
  const data = res.json();
  return data;


}
