import axios from "axios";

const API_URL = "http://localhost:8080/api/checkout";

export const createCheckout = async (checkoutData) => {
  const response = await axios.post(API_URL, checkoutData);

  return response.data;
};
