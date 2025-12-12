export default async function getPastOrders(page) {
  const response = await fetch(`/api/past-orders?page=${page}`);
  const data = await response.json();

  console.table(data);
  console.log(data);  
  if(Array.isArray(data)){console.log("Array");}

  return data;
}
