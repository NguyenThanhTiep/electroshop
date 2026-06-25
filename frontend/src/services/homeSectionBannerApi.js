import axios from "axios";

const API_URL = "http://localhost:8080/api/home-section-banners";

export const getSectionBanners = async (sectionId) => {
  const response = await axios.get(`${API_URL}/section/${sectionId}`);

  return response.data;
};

export const getActiveSectionBanners = async (sectionId) => {
  const response = await axios.get(`${API_URL}/section/${sectionId}/active`);

  return response.data;
};

export const getSectionBannerDetail = async (bannerId) => {
  const response = await axios.get(`${API_URL}/${bannerId}/detail`);

  return response.data;
};

export const createSectionBanner = async (sectionId, banner) => {
  const response = await axios.post(`${API_URL}/section/${sectionId}`, banner);

  return response.data;
};

export const updateSectionBanner = async (bannerId, banner) => {
  const response = await axios.put(`${API_URL}/${bannerId}`, banner);

  return response.data;
};

export const deleteSectionBanner = async (bannerId) => {
  const response = await axios.delete(`${API_URL}/${bannerId}`);

  return response.data;
};

export const setSectionBannerProducts = async (bannerId, productIds) => {
  const response = await axios.post(`${API_URL}/${bannerId}/products`, {
    productIds,
  });

  return response.data;
};

export const getSectionBannerProducts = async (bannerId) => {
  const response = await axios.get(`${API_URL}/${bannerId}/products`);

  return response.data;
};
