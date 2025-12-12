import axios from "axios";

const postContact = async (name, email, message) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, message }),
  });

  if (!res.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await res.json();
  return data;
};

const PostContact = async (name, email, message) => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/contact`,
    {
      name,
      email,
      message,
    }
  );

  return response.data;
};

export { postContact, PostContact };
