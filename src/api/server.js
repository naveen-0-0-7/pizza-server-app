// server.mjs
import fastify from "fastify";
// fastifyStatic intentionally removed per lesson (client serves public/)
import path from "path";
import { fileURLToPath } from "url";
import { AsyncDatabase } from "promised-sqlite3";

const server = fastify({
  logger: {
    transport: {
      target: "pino-pretty",
    },
  },
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = await AsyncDatabase.open("./pizza.sqlite");

/*
  Lesson-style permissive CORS hook.
  This is intentionally permissive (allowed for the course/demo).
  If you want stricter CORS in production, replace this with @fastify/cors
  and a proper origin list.
*/
server.addHook("preHandler", (request, reply, done) => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  reply.header("Access-Control-Allow-Headers", "*");

  if (request.method === "OPTIONS") {
    // reply to preflight and end here
    return reply.code(204).send();
  }

  done();
});

/* --- routes (kept similar to your original) --- */

server.get("/api/pizzas", async function getPizzas(request, reply) {
  const pizzasPromise = db.all(
    "SELECT pizza_type_id, name, category, ingredients as description FROM pizza_types"
  );
  const pizzaSizesPromise = db.all(
    `SELECT 
      pizza_type_id as id, size, price
    FROM 
      pizzas
  `
  );

  const [pizzas, pizzaSizes] = await Promise.all([
    pizzasPromise,
    pizzaSizesPromise,
  ]);

  const responsePizzas = pizzas.map((pizza) => {
    const sizes = pizzaSizes.reduce((acc, current) => {
      if (current.id === pizza.pizza_type_id) {
        acc[current.size] = +current.price;
      }
      return acc;
    }, {});
    return {
      id: pizza.pizza_type_id,
      name: pizza.name,
      category: pizza.category,
      description: pizza.description,
      image: `/pizzas/${pizza.pizza_type_id}.webp`,
      sizes,
    };
  });

  return reply.code(200).send(responsePizzas);
});

server.get("/api/pizza-of-the-day", async function getPizzaOfTheDay(
  request,
  reply
) {
  const pizzas = await db.all(
    `SELECT 
      pizza_type_id as id, name, category, ingredients as description
    FROM 
      pizza_types`
  );

  const daysSinceEpoch = Math.floor(Date.now() / 86400000);
  const pizzaIndex = daysSinceEpoch % pizzas.length;
  const pizza = pizzas[pizzaIndex];

  const sizes = await db.all(
    `SELECT
      size, price
    FROM
      pizzas
    WHERE
      pizza_type_id = ?`,
    [pizza.id]
  );

  const sizeObj = sizes.reduce((acc, current) => {
    acc[current.size] = +current.price;
    return acc;
  }, {});

  const responsePizza = {
    id: pizza.id,
    name: pizza.name,
    category: pizza.category,
    description: pizza.description,
    image: `/pizzas/${pizza.id}.webp`,
    sizes: sizeObj,
  };

  return reply.code(200).send(responsePizza);
});

server.get("/api/orders", async function getOrders(request, reply) {
  const id = request.query.id;
  const orders = await db.all("SELECT order_id, date, time FROM orders");
  return reply.code(200).send(orders);
});

server.get("/api/order", async function getOrders(request, reply) {
  const id = request.query.id;
  const orderPromise = db.get(
    "SELECT order_id, date, time FROM orders WHERE order_id = ?",
    [id]
  );
  const orderItemsPromise = db.all(
    `SELECT 
      t.pizza_type_id as pizzaTypeId, t.name, t.category, t.ingredients as description, o.quantity, p.price, o.quantity * p.price as total, p.size
    FROM 
      order_details o
    JOIN
      pizzas p
    ON
      o.pizza_id = p.pizza_id
    JOIN
      pizza_types t
    ON
      p.pizza_type_id = t.pizza_type_id
    WHERE 
      order_id = ?`,
    [id]
  );

  const [order, orderItemsRes] = await Promise.all([orderPromise, orderItemsPromise]);

  const orderItems = orderItemsRes.map((item) =>
    Object.assign({}, item, {
      image: `/pizzas/${item.pizzaTypeId}.webp`,
      quantity: +item.quantity,
      price: +item.price,
    })
  );

  const total = orderItems.reduce((acc, item) => acc + +item.total, 0);

  return reply.code(200).send({
    order: Object.assign({ total }, order),
    orderItems,
  });
});

server.post("/api/order", async function createOrder(request, reply) {
  const { cart } = request.body;

  const now = new Date();
  const time = now.toLocaleTimeString("en-US", { hour12: false });
  const date = now.toISOString().split("T")[0];

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return reply.code(400).send({ error: "Invalid order data" });
  }

  try {
    await db.run("BEGIN TRANSACTION");

    const result = await db.run(
      "INSERT INTO orders (date, time) VALUES (?, ?)",
      [date, time]
    );
    const orderId = result.lastID;

    const mergedCart = cart.reduce((acc, item) => {
      const id = item.pizza.id;
      const size = item.size.toLowerCase();
      if (!id || !size) {
        throw new Error("Invalid item data");
      }
      const pizzaId = `${id}_${size}`;

      if (!acc[pizzaId]) {
        acc[pizzaId] = { pizzaId, quantity: 1 };
      } else {
        acc[pizzaId].quantity += 1;
      }

      return acc;
    }, {});

    for (const item of Object.values(mergedCart)) {
      const { pizzaId, quantity } = item;
      await db.run(
        "INSERT INTO order_details (order_id, pizza_id, quantity) VALUES (?, ?, ?)",
        [orderId, pizzaId, quantity]
      );
    }

    await db.run("COMMIT");

    return reply.code(200).send({ orderId });
  } catch (error) {
    request.log.error(error);
    await db.run("ROLLBACK");
    return reply.code(500).send({ error: "Failed to create order" });
  }
});

server.get("/api/past-orders", async function getPastOrders(request, reply) {
  try {
    const page = parseInt(request.query.page, 10) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const pastOrders = await db.all(
      "SELECT order_id, date, time FROM orders ORDER BY order_id DESC LIMIT 10 OFFSET ?",
      [offset]
    );
    return reply.code(200).send(pastOrders);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to fetch past orders" });
  }
});

server.get("/api/past-order/:order_id", async function getPastOrder(request, reply) {
  const orderId = request.params.order_id;

  try {
    const order = await db.get(
      "SELECT order_id, date, time FROM orders WHERE order_id = ?",
      [orderId]
    );

    if (!order) {
      return reply.code(404).send({ error: "Order not found" });
    }

    const orderItems = await db.all(
      `SELECT 
        t.pizza_type_id as pizzaTypeId, t.name, t.category, t.ingredients as description, o.quantity, p.price, o.quantity * p.price as total, p.size
      FROM 
        order_details o
      JOIN
        pizzas p
      ON
        o.pizza_id = p.pizza_id
      JOIN
        pizza_types t
      ON
        p.pizza_type_id = t.pizza_type_id
      WHERE 
        order_id = ?`,
      [orderId]
    );

    const formattedOrderItems = orderItems.map((item) =>
      Object.assign({}, item, {
        image: `/pizzas/${item.pizzaTypeId}.webp`,
        quantity: +item.quantity,
        price: +item.price,
      })
    );

    const total = formattedOrderItems.reduce((acc, item) => acc + item.total, 0);

    return reply.code(200).send({
      order: Object.assign({ total }, order),
      orderItems: formattedOrderItems,
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to fetch order" });
  }
});

server.post("/api/contact", async function contactForm(request, reply) {
  const { name, email, message } = request.body;

  if (!name || !email || !message) {
    return reply.code(400).send({ error: "All fields are required" });
  }

  request.log.info(`Contact Form Submission:
    Name: ${name}
    Email: ${email}
    Message: ${message}
  `);

  return reply.code(200).send({ success: "Message received" });
});

/* start the server */
const start = async () => {
  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`Server listening on ${HOST}:${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
