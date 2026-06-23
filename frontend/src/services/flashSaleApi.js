const API_URL = "http://localhost:8080/api/flash-sales";

export const getFlashSales = async () => {
  const response = await fetch(API_URL);

  return response.json();
};

export const getActiveFlashSale = async () => {
  const response = await fetch(`${API_URL}/active`);

  if (!response.ok) {
    return null;
  }

  return response.json();
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

  return response.json();
};

export const getFlashSaleById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`);

  return response.json();
};

export const createFlashSale = async (flashSale) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(flashSale),
  });

  return response.json();
};

export const updateFlashSale = async (id, flashSale) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(flashSale),
  });

  return response.json();
};

export const deleteFlashSale = async (id) => {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
};

export const getFlashSaleItems = async (flashSaleId) => {
  const response = await fetch(`${API_URL}/${flashSaleId}/items`);

  return response.json();
};

export const addFlashSaleItem = async (flashSaleId, item) => {
  const response = await fetch(`${API_URL}/${flashSaleId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });

  return response.json();
};

export const updateFlashSaleItem = async (itemId, item) => {
  const response = await fetch(`${API_URL}/items/${itemId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });

  return response.json();
};

export const deleteFlashSaleItem = async (itemId) => {
  await fetch(`${API_URL}/items/${itemId}`, {
    method: "DELETE",
  });
};
