import axios from "axios";

const API_URL = "http://localhost:8080/api/banners";

export const getBanners = async () => {
  const response = await axios.get(API_URL);

  return response.data;
};

export const getActiveBanners = async () => {
  const response = await axios.get(`${API_URL}/active`);

  return response.data;
};

export const getBannersByPosition = async (position) => {
  const response = await axios.get(`${API_URL}/position/${position}`);

  return response.data;
};

export const createBanner = async (banner) => {
  const response = await axios.post(API_URL, banner);

  return response.data;
};

export const updateBanner = async (id, banner) => {
  const response = await axios.put(`${API_URL}/${id}`, banner);

  return response.data;
};

export const deleteBanner = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);

  return response.data;
};
