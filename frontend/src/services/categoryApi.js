import axios from "axios";

const API = "http://localhost:8080/api/categories";

export const getCategories = async () => {
  const response = await axios.get(API);

  return response.data;
};

export const createCategory = async (category) => {
  const response = await axios.post(API, category);

  return response.data;
};

export const updateCategory = async (id, category) => {
  const response = await axios.put(`${API}/${id}`, category);

  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await axios.delete(`${API}/${id}`);

  return response.data;
};
