import Model from "./Modal";
import { priceConvertor } from "../src/api/currencyConvertor";

export default function OderInfoModel({
  pastOrderData,
  focusedOrder,
  setFocusedOrder,
  isLoadingPastOrder,
}) {

    // console.log("pastOrderData= ",pastOrderData);
  return (
    <>
      {focusedOrder ? (
        <Model>
          <h2>Order #{focusedOrder}</h2>
          {!isLoadingPastOrder ? (
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {pastOrderData?.orderItems?.map((pizza) => (
                  <tr key={`${pizza.pizzaTypeId}_${pizza.size}`}>
                    <td>
                      <img src={pizza.image} alt={pizza.name} />
                    </td>
                    <td>{pizza.name}</td>
                    <td>{pizza.size}</td>
                    <td>{pizza.quantity}</td>
                    <td>{priceConvertor(pizza.price)}</td>
                    <td>{priceConvertor(pizza.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Loading...</p>
          )}

          <button onClick={() => setFocusedOrder(undefined)}>Close </button>
        </Model>
      ) : null}
    </>
  );
}
