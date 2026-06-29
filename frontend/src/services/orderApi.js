import axios from "axios";

const API_URL = "http://localhost:8080/api/orders";

/*
 * Giữ lại nếu code cũ còn sử dụng.
 * Checkout hiện tại dùng /api/checkout.
 */
export const createOrder = async (order) => {
  const response = await axios.post(API_URL, order);

  return response.data;
};

/*
 * Chỉ Admin dùng để lấy tất cả đơn.
 */
export const getOrders = async () => {
  const response = await axios.get(API_URL);

  return response.data;
};

/*
 * Khách hàng chỉ lấy đơn của mình.
 */
export const getOrdersByUser = async (userId) => {
  const response = await axios.get(`${API_URL}/user/${userId}`);

  return response.data;
};

export const getOrderById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);

  return response.data;
};

/*
 * Admin cập nhật trạng thái đơn.
 */
export const updateOrderStatus = async (id, status) => {
  const response = await axios.put(`${API_URL}/${id}/status`, null, {
    params: {
      status,
    },
  });

  return response.data;
};

/*
 * Khách hàng hủy đơn của mình.
 */
export const cancelOrder = async (id) => {
  const response = await axios.put(`${API_URL}/${id}/cancel`);
  return response.data;
};
