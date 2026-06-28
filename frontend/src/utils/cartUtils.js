const LEGACY_CART_KEY = "cart";
const CART_KEY_PREFIX = "cart";
const BUY_NOW_KEY = "buyNowItem";

const notifyCartUpdated = () => {
  window.dispatchEvent(new Event("cartUpdated"));
};

const getCurrentUser = () => {
  try {
    const savedUser = localStorage.getItem("currentUser");

    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
};

const getCurrentUserCartIdentity = () => {
  const currentUser = getCurrentUser();

  const userId =
    currentUser?.id || currentUser?.userId || currentUser?.user?.id;

  if (userId) {
    return `user_${userId}`;
  }

  const email = currentUser?.email || currentUser?.user?.email;

  if (email) {
    return `email_${String(email).toLowerCase()}`;
  }

  return "guest";
};

const getCartStorageKey = () => {
  return `${CART_KEY_PREFIX}_${getCurrentUserCartIdentity()}`;
};

const getGuestCartStorageKey = () => {
  return `${CART_KEY_PREFIX}_guest`;
};

const readCartByKey = (key) => {
  try {
    const savedCart = localStorage.getItem(key);

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

const writeCartByKey = (key, cart) => {
  const safeCart = Array.isArray(cart) ? cart : [];

  localStorage.setItem(key, JSON.stringify(safeCart));

  return safeCart;
};

const createCartItemKey = (item) => {
  const productId = item.productId || item.id;
  const selectedOptionsText = JSON.stringify(item.selectedOptions || {});

  return `${productId}-${selectedOptionsText}`;
};

export const getCart = () => {
  return readCartByKey(getCartStorageKey());
};

export const saveCart = (cart) => {
  const savedCart = writeCartByKey(getCartStorageKey(), cart);

  notifyCartUpdated();

  return savedCart;
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
    const newQuantity = Number(existingProduct.quantity || 1) + productQuantity;

    /*
     * Quan trọng:
     * Cập nhật lại toàn bộ thông tin giá mới nhất.
     * Ví dụ sản phẩm cũ trong giỏ là giá thường,
     * sau đó sản phẩm đang Flash Sale thì phải cập nhật sang giá Flash Sale.
     */
    Object.assign(existingProduct, {
      ...cartProduct,
      quantity: newQuantity,
      cartKey: newCartKey,
    });
  } else {
    cart.push({
      ...cartProduct,
      cartKey: newCartKey,
    });
  }

  return saveCart(cart);
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
  localStorage.removeItem(getCartStorageKey());
  sessionStorage.removeItem("checkoutCouponCode");

  notifyCartUpdated();
};

export const saveBuyNowItem = (product) => {
  const buyNowProduct = {
    ...product,
    quantity: Number(product.quantity || 1),
  };

  sessionStorage.setItem(
    BUY_NOW_KEY,
    JSON.stringify({
      ...buyNowProduct,
      cartKey: createCartItemKey(buyNowProduct),
    }),
  );

  sessionStorage.setItem("checkoutSource", "BUY_NOW");

  notifyCartUpdated();

  return buyNowProduct;
};

export const getBuyNowItem = () => {
  try {
    const savedItem = sessionStorage.getItem(BUY_NOW_KEY);

    if (!savedItem) {
      return null;
    }

    return JSON.parse(savedItem);
  } catch {
    return null;
  }
};

export const clearBuyNowItem = () => {
  sessionStorage.removeItem(BUY_NOW_KEY);
  sessionStorage.removeItem("checkoutSource");
  sessionStorage.removeItem("checkoutCouponCode");

  notifyCartUpdated();
};

export const mergeGuestCartToCurrentUser = () => {
  const userCartKey = getCartStorageKey();
  const guestCartKey = getGuestCartStorageKey();

  if (userCartKey === guestCartKey) {
    return getCart();
  }

  const guestCart = readCartByKey(guestCartKey);
  const userCart = readCartByKey(userCartKey);

  if (guestCart.length === 0) {
    localStorage.removeItem(LEGACY_CART_KEY);
    notifyCartUpdated();

    return userCart;
  }

  const mergedCart = [...userCart];

  guestCart.forEach((guestItem) => {
    const guestItemKey = guestItem.cartKey || createCartItemKey(guestItem);

    const existingItem = mergedCart.find((item) => {
      const itemKey = item.cartKey || createCartItemKey(item);

      return itemKey === guestItemKey;
    });

    if (existingItem) {
      existingItem.quantity =
        Number(existingItem.quantity || 1) + Number(guestItem.quantity || 1);
    } else {
      mergedCart.push({
        ...guestItem,
        cartKey: guestItemKey,
      });
    }
  });

  writeCartByKey(userCartKey, mergedCart);

  localStorage.removeItem(guestCartKey);
  localStorage.removeItem(LEGACY_CART_KEY);

  notifyCartUpdated();

  return mergedCart;
};
