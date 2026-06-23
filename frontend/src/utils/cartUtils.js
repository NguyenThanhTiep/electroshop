const CART_KEY = "cart";

const notifyCartUpdated = () => {
  window.dispatchEvent(new Event("cartUpdated"));
};

const createCartItemKey = (item) => {
  const selectedOptionsText = JSON.stringify(item.selectedOptions || {});

  return `${item.id}-${selectedOptionsText}`;
};

export const addToCart = (product, quantity = 1) => {
  const cart = getCart();

  const productQuantity = Number(product.quantity || quantity || 1);

  const cartProduct = {
    ...product,
    quantity: productQuantity,
  };

  const newCartKey = createCartItemKey(cartProduct);

  const existingProduct = cart.find((item) => {
    const itemKey = item.cartKey || createCartItemKey(item);

    return itemKey === newCartKey;
  });

  if (existingProduct) {
    existingProduct.quantity =
      Number(existingProduct.quantity || 1) + productQuantity;
  } else {
    cart.push({
      ...cartProduct,
      cartKey: newCartKey,
    });
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));

  window.dispatchEvent(new Event("cartUpdated"));

  notifyCartUpdated();

  return cart;
};

export const getCart = () => {
  try {
    const savedCart = localStorage.getItem(CART_KEY);

    if (!savedCart) {
      return [];
    }

    const parsedCart = JSON.parse(savedCart);

    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch (error) {
    console.error("Không thể đọc giỏ hàng:", error);

    return [];
  }
};

export const saveCart = (cart) => {
  const safeCart = Array.isArray(cart) ? cart : [];

  localStorage.setItem(CART_KEY, JSON.stringify(safeCart));

  notifyCartUpdated();

  return safeCart;
};

export const updateCartQuantity = (cartKeyOrId, quantity) => {
  const newQuantity = Number(quantity);

  if (newQuantity <= 0) {
    return removeFromCart(cartKeyOrId);
  }

  const updatedCart = getCart().map((item) => {
    const itemKey = item.cartKey || createCartItemKey(item);

    if (itemKey === cartKeyOrId || item.id === cartKeyOrId) {
      return {
        ...item,
        quantity: newQuantity,
      };
    }

    return item;
  });

  return saveCart(updatedCart);
};

export const removeFromCart = (cartKeyOrId) => {
  const updatedCart = getCart().filter((item) => {
    const itemKey = item.cartKey || createCartItemKey(item);

    return itemKey !== cartKeyOrId && item.id !== cartKeyOrId;
  });

  return saveCart(updatedCart);
};

export const clearCart = () => {
  localStorage.removeItem(CART_KEY);

  sessionStorage.removeItem("checkoutCouponCode");

  notifyCartUpdated();
};
