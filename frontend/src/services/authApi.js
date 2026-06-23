import axios from "axios";

const API_URL = "http://localhost:8080/api/auth";

export const login = async (data) => {
  const response = await axios.post(`${API_URL}/login`, data);

  return response.data;
};

export const register = async (data) => {
  const response = await axios.post(`${API_URL}/register`, data);

  return response.data;
};
