import { getActiveFlashSales } from "../services/flashSaleApi";
import { getActivePromotions } from "../services/promotionApi";
import { getProducts } from "../services/productApi";

const CACHE_TTL_MS = 3 * 60 * 1000;

const cacheStore = new Map();

const getCachedValue = (key, loader) => {
  const now = Date.now();
  const cached = cacheStore.get(key);

  if (cached?.data && cached.expiresAt > now) {
    return Promise.resolve(cached.data);
  }

  if (cached?.promise && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = loader()
    .then((data) => {
      cacheStore.set(key, {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return data;
    })
    .catch((error) => {
      cacheStore.delete(key);
      throw error;
    });

  cacheStore.set(key, {
    promise,
    expiresAt: now + CACHE_TTL_MS,
  });

  return promise;
};

export const getCachedProducts = () => getCachedValue("products", getProducts);

export const getCachedActivePromotions = () =>
  getCachedValue("activePromotions", getActivePromotions);

export const getCachedActiveFlashSales = () =>
  getCachedValue("activeFlashSales", getActiveFlashSales);
