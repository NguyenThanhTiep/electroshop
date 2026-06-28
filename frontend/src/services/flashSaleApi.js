const API_URL = "http://localhost:8080/api/flash-sales";

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

const parseResponseBody = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const handleResponse = async (response) => {
  const data = await parseResponseBody(response);

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

export const getFlashSales = async () => {
  const response = await fetch(API_URL, {
    headers: getJsonHeaders(),
  });

  return handleResponse(response);
};

export const getActiveFlashSale = async () => {
  const response = await fetch(`${API_URL}/active`);

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  return parseResponseBody(response);
};

export const getActiveFlashSales = async () => {
  const response = await fetch(`${API_URL}/active-list`);

  if (response.status === 204) {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  const data = await parseResponseBody(response);

  return Array.isArray(data) ? data : [];
};

export const getActiveFlashSaleProduct = async (productId) => {
  if (!productId) {
    return null;
  }

  const response = await fetch(`${API_URL}/active/product/${productId}`);

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  return parseResponseBody(response);
};

export const getFlashSaleById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getJsonHeaders(),
  });

  return handleResponse(response);
};

export const createFlashSale = async (flashSale) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(flashSale),
  });

  return handleResponse(response);
};

export const updateFlashSale = async (id, flashSale) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getJsonHeaders(),
    body: JSON.stringify(flashSale),
  });

  return handleResponse(response);
};

export const deleteFlashSale = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getJsonHeaders(),
  });

  return handleResponse(response);
};

export const getFlashSaleItems = async (flashSaleId) => {
  const response = await fetch(`${API_URL}/${flashSaleId}/items`, {
    headers: getJsonHeaders(),
  });

  return handleResponse(response);
};

export const addFlashSaleItem = async (flashSaleId, item) => {
  const response = await fetch(`${API_URL}/${flashSaleId}/items`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(item),
  });

  return handleResponse(response);
};

export const updateFlashSaleItem = async (itemId, item) => {
  const response = await fetch(`${API_URL}/items/${itemId}`, {
    method: "PUT",
    headers: getJsonHeaders(),
    body: JSON.stringify(item),
  });

  return handleResponse(response);
};

export const deleteFlashSaleItem = async (itemId) => {
  const response = await fetch(`${API_URL}/items/${itemId}`, {
    method: "DELETE",
    headers: getJsonHeaders(),
  });

  return handleResponse(response);
};
