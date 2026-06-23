import axios from "axios";

const API_URL = "http://localhost:8080/api/reviews";

export const getReviewsByProduct = async (productId) => {
  const response = await axios.get(`${API_URL}/product/${productId}`);

  return response.data;
};

export const getReviewSummary = async (productId) => {
  const response = await axios.get(`${API_URL}/product/${productId}/summary`);

  return response.data;
};

export const createReview = async (review) => {
  const response = await axios.post(API_URL, review);

  return response.data;
};

export const updateReview = async (reviewId, review) => {
  const response = await axios.put(`${API_URL}/${reviewId}`, review);

  return response.data;
};

export const deleteReview = async (reviewId, userId) => {
  await axios.delete(`${API_URL}/${reviewId}`, {
    params: {
      userId,
    },
  });
};
