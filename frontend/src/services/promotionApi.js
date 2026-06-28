const API_URL = "http://localhost:8080/api/promotions";

const getJsonHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = localStorage.getItem("token");

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text || null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data ||
      `Request failed with status ${response.status}`;

    const error = new Error(message);

    error.response = {
      status: response.status,
      data,
    };

    throw error;
  }

  return data;
};

export const getPromotions = async () => {
  const response = await fetch(API_URL, {
    headers: getJsonHeaders(),
  });

  return handleResponse(response);
};

export const getActivePromotions = async () => {
  const response = await fetch(`${API_URL}/active`, {
    headers: getJsonHeaders(),
  });

  return handleResponse(response);
};

export const createPromotion = async (promotion) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(promotion),
  });

  return handleResponse(response);
};

export const updatePromotion = async (id, promotion) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getJsonHeaders(),
    body: JSON.stringify(promotion),
  });

  return handleResponse(response);
};

export const deletePromotion = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getJsonHeaders(),
  });

  return handleResponse(response);
};
