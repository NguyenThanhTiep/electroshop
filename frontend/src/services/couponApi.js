const API_URL = "http://localhost:8080/api/coupons";

export const getCoupons = async () => {
  const response = await fetch(API_URL);

  return response.json();
};

export const createCoupon = async (coupon) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(coupon),
  });

  return response.json();
};

export const updateCoupon = async (id, coupon) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(coupon),
  });

  return response.json();
};

export const deleteCoupon = async (id) => {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
};

export const applyCoupon = async (payload) => {
  const response = await fetch(`${API_URL}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};

export const getActiveCoupons = async () => {
  const response = await fetch(API_URL);

  const data = await response.json();

  if (!Array.isArray(data)) {
    return [];
  }

  const today = new Date();

  return data.filter((coupon) => {
    if (coupon.active === false) {
      return false;
    }

    const startDate = coupon.startDate ? new Date(coupon.startDate) : null;

    const endDate = coupon.endDate ? new Date(coupon.endDate) : null;

    if (startDate && today < startDate) {
      return false;
    }

    if (endDate && today > endDate) {
      return false;
    }

    return true;
  });
};
