const API_URL = "http://localhost:8080/api/promotions";

export const getPromotions = async () => {
  const response = await fetch(API_URL);

  return response.json();
};

export const getActivePromotions = async () => {
  const response = await fetch(`${API_URL}/active`);

  return response.json();
};

export const createPromotion = async (promotion) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(promotion),
  });

  return response.json();
};

export const updatePromotion = async (id, promotion) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(promotion),
  });

  return response.json();
};

export const deletePromotion = async (id) => {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
};
