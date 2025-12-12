import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import getPastOrders from "../api/getPastOrders";
import getPastOrder from "../api/getPastOrder";
import OderInfoModel from "../focusedOrderPopup";
import ErrorBoundary from "../ErrorBoundary";
export const Route = createLazyFileRoute("/past")({
  component: ErrorBoundaryWrappedPastOrderRoutes,
});

function ErrorBoundaryWrappedPastOrderRoutes(props) {
 return ( <ErrorBoundary>
    <PastOrdersRoute  {...props}/>
  </ErrorBoundary>);
}

function PastOrdersRoute() {
  // throw new Error("lol");
  const [page, setPage] = useState(1);
  const [focusedOrder, setFocusedOrder] = useState(undefined);

  const { isLoading, data } = useQuery({
    queryKey: ["past-orders", page],
    queryFn: () => getPastOrders(page),
    staleTime: 30000,
  });


  const { isLoading: isLoadingPastOrder, data: pastOrderData } = useQuery({
    queryKey: ["past-order", focusedOrder],
    queryFn: () => getPastOrder(focusedOrder),
    enabled: !!focusedOrder,
    staleTime: 24 * 60 * 60 * 1000, 
  });

  function sNo(page, index) {
    return (page - 1) * 10 + (index + 1);
  }

  if (isLoading) {
    return (
      <div>
        <h2>
          <div>....Loading</div>
        </h2>
      </div>
    );
  }

  return (
    <div className="past-orders">
      <table>
        <thead>
          <tr>
            <td>S.No</td>
            <td>ID</td>
            <td>Date</td>
            <td>Time</td>
          </tr>
        </thead>

        <tbody>
          {data.map((order, index) => (
            <tr key={order.order_id}>
              <td>{sNo(page, index)}</td>
              <td>
                <button onClick={() => setFocusedOrder(order.order_id)}>
                  {order.order_id}
                </button>
              </td>
              <td>{order.date}</td>
              <td>{order.time}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pages">
        <button
          disabled={page <= 1}
          onClick={() => {
            setPage(page - 1);
          }}
        >
          Previous
        </button>

        <button
          disabled={data.length < 10}
          onClick={() => {
            setPage(page + 1);
          }}
        >
          Next
        </button>
      </div>
      <OderInfoModel
        pastOrderData={pastOrderData}
        focusedOrder={focusedOrder}
        setFocusedOrder={setFocusedOrder}
        isLoadingPastOrder={isLoadingPastOrder}
      />
    </div>
  );
}
