import axios from "axios";

const API = "http://localhost:8080/api/brands";

export const getBrands = async () => {
  const response = await axios.get(API);

  return response.data;
};

export const createBrand = async (brand) => {
  const response = await axios.post(API, brand);

  return response.data;
};

export const updateBrand = async (id, brand) => {
  const response = await axios.put(`${API}/${id}`, brand);

  return response.data;
};

export const deleteBrand = async (id) => {
  const response = await axios.delete(`${API}/${id}`);

  return response.data;
};
