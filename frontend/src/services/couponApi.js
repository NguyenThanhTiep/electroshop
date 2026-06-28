const API_URL = "http://localhost:8080/api/coupons";

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

export const getCoupons = async () => {
  const response = await fetch(API_URL, {
    headers: getJsonHeaders(),
  });

  return handleResponse(response);
};

export const createCoupon = async (coupon) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(coupon),
  });

  return handleResponse(response);
};

export const updateCoupon = async (id, coupon) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getJsonHeaders(),
    body: JSON.stringify(coupon),
  });

  return handleResponse(response);
};

export const deleteCoupon = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getJsonHeaders(),
  });

  return handleResponse(response);
};

export const applyCoupon = async (payload) => {
  const response = await fetch(`${API_URL}/apply`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

export const getActiveCoupons = async () => {
  const data = await getCoupons();

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
