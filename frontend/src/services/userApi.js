import axios from "axios";

const API = "http://localhost:8080/api/admin/users";

export const getAdminUsers = async () => {
  const response = await axios.get(API);

  return response.data;
};

export const updateAdminUserLock = async (id, locked) => {
  const response = await axios.patch(`${API}/${id}/lock`, {
    locked,
  });

  return response.data;
};

export const deleteAdminUser = async (id) => {
  const response = await axios.delete(`${API}/${id}`);

  return response.data;
};
