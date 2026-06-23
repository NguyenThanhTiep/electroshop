import axios from "axios";

const API = "http://localhost:8080/api/upload";

export const uploadImage = async (file) => {
  if (!file) {
    throw new Error("Không có file để upload");
  }

  const formData = new FormData();

  formData.append("file", file);

  const response = await axios.post(API, formData);

  return response.data;
};
