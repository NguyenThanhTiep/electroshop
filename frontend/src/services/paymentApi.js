import axios from "axios";

const API_URL = "http://localhost:8080/api/payments/vnpay";

export const getVnpayPaymentStatus = async (txnRef) => {
  const response = await axios.get(
    `${API_URL}/status/${encodeURIComponent(txnRef)}`,
  );

  return response.data;
};
