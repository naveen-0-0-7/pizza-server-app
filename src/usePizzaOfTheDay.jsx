import { useState, useEffect } from "react";

export const usePizzaOfTheDay = () => {
  const [pizzaOfTheDay, setPizzaOfTheDay] = useState(null);
  // const [loading,setloading]=useState(true);
  useEffect(() => {
    async function fetchPizzaOfTheDay() {
      // setloading(true);
      await new  Promise((resolve) => { setTimeout(resolve, 2000) });


      const response = await fetch("/api/pizza-of-the-day");
      const data = await response.json();
      setPizzaOfTheDay(data);
      // setloading(false);
    }

    fetchPizzaOfTheDay();
  }, []);

  return pizzaOfTheDay;
};