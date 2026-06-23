import axios from "axios";

const API_URL = "http://localhost:8080/api/home-sections";

export const getHomeSections = async () => {
  const response = await axios.get(API_URL);

  return response.data;
};

export const getActiveHomeSections = async () => {
  const response = await axios.get(`${API_URL}/active`);

  return response.data;
};

export const createHomeSection = async (section) => {
  const response = await axios.post(API_URL, section);

  return response.data;
};

export const updateHomeSection = async (id, section) => {
  const response = await axios.put(`${API_URL}/${id}`, section);

  return response.data;
};

export const deleteHomeSection = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);

  return response.data;
};
