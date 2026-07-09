import "./SearchPage.css";

import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import HomeProductCard from "../components/home/HomeProductCard";

import { getProducts } from "../services/productApi";

import { getBannerDetail } from "../services/bannerApi";

import { getSectionBannerDetail } from "../services/homeSectionBannerApi";

import { getActivePromotions } from "../services/promotionApi";

import { getActiveFlashSale } from "../services/flashSaleApi";

const SEARCH_PAGE_SIZE = 15;

const SEARCH_CACHE_TTL = 5 * 60 * 1000;

const SEARCH_DATA_CACHE_KEY = "electroshop.searchPage.data.v1";

const SEARCH_BANNER_CACHE_PREFIX = "electroshop.searchPage.banner.";

const PRICE_FILTERS = [
  {
    label: "Dưới 15 triệu",
    minPrice: "",
    maxPrice: "15000000",
  },
  {
    label: "15 - 25 triệu",
    minPrice: "15000000",
    maxPrice: "25000000",
  },
  {
    label: "25 - 40 triệu",
    minPrice: "25000000",
    maxPrice: "40000000",
  },
  {
    label: "Trên 40 triệu",
    minPrice: "40000000",
    maxPrice: "",
  },
];

const readTimedCache = (key) => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawCache = window.sessionStorage.getItem(key);

    if (!rawCache) {
      return null;
    }

    const parsedCache = JSON.parse(rawCache);

    if (
      !parsedCache?.cachedAt ||
      Date.now() - Number(parsedCache.cachedAt) > SEARCH_CACHE_TTL
    ) {
      window.sessionStorage.removeItem(key);

      return null;
    }

    return parsedCache.data || null;
  } catch (error) {
    return null;
  }
};

const writeTimedCache = (key, data) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      key,
      JSON.stringify({
        cachedAt: Date.now(),
        data,
      }),
    );
  } catch (error) {
    // Ignore storage quota or private-mode errors.
  }
};

const normalizeSearchData = (data) => ({
  products: Array.isArray(data?.products) ? data.products : [],
  activePromotions: Array.isArray(data?.activePromotions)
    ? data.activePromotions
    : [],
  activeFlashSale: data?.activeFlashSale || null,
});

const normalizeBannerDetail = (detail) => ({
  banner: detail?.banner || null,
  products: Array.isArray(detail?.products) ? detail.products : [],
});

export default function SearchPage() {
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const cachedInitialSearchData = useMemo(
    () => readTimedCache(SEARCH_DATA_CACHE_KEY),
    [],
  );

  const initialSearchData = useMemo(
    () => normalizeSearchData(cachedInitialSearchData),
    [cachedInitialSearchData],
  );

  const pageParam = searchParams.get("page") || "";

  const isPromotionPage = pageParam === "promotion";

  const keyword = searchParams.get("keyword") || "";

  const categoryParam = searchParams.get("category") || "";

  const brandParam = searchParams.get("brand") || "";

  const minPriceParam = searchParams.get("minPrice") || "";

  const maxPriceParam = searchParams.get("maxPrice") || "";

  const sortParam = searchParams.get("sort") || "";

  const bannerIdParam = searchParams.get("bannerId") || "";

  const homeBannerIdParam = searchParams.get("homeBannerId") || "";

  const productIdsParam = searchParams.get("productIds") || "";

  const dealParam = searchParams.get("deal") || "";

  const stockParam = searchParams.get("stock") || "";

  const isBannerCollection = Boolean(bannerIdParam || homeBannerIdParam);

  const [products, setProducts] = useState(initialSearchData.products);

  const [bannerInfo, setBannerInfo] = useState(null);

  const [bannerProducts, setBannerProducts] = useState([]);

  const [activePromotions, setActivePromotions] = useState(
    initialSearchData.activePromotions,
  );

  const [activeFlashSale, setActiveFlashSale] = useState(
    initialSearchData.activeFlashSale,
  );

  const [loadingBanner, setLoadingBanner] = useState(false);

  const [loadingProducts, setLoadingProducts] = useState(
    !cachedInitialSearchData,
  );

  const [visibleProductCount, setVisibleProductCount] =
    useState(SEARCH_PAGE_SIZE);

  useEffect(() => {
    loadInitialSearchData();
  }, []);

  useEffect(() => {
    if (homeBannerIdParam) {
      fetchBannerProducts(homeBannerIdParam, "home");
      return;
    }

    fetchBannerProducts(bannerIdParam, "section");
  }, [bannerIdParam, homeBannerIdParam]);

  const loadInitialSearchData = async () => {
    const cachedData = readTimedCache(SEARCH_DATA_CACHE_KEY);

    if (cachedData) {
      const normalizedCache = normalizeSearchData(cachedData);

      setProducts(normalizedCache.products);

      setActivePromotions(normalizedCache.activePromotions);

      setActiveFlashSale(normalizedCache.activeFlashSale);

      setLoadingProducts(false);
    } else {
      setLoadingProducts(true);
    }

    try {
      const [productData, promotionData, flashSaleData] = await Promise.all([
        getProducts(),
        getActivePromotions(),
        getActiveFlashSale(),
      ]);

      const normalizedData = normalizeSearchData({
        products: productData,
        activePromotions: promotionData,
        activeFlashSale: flashSaleData,
      });

      setProducts(normalizedData.products);

      setActivePromotions(normalizedData.activePromotions);

      setActiveFlashSale(normalizedData.activeFlashSale);

      writeTimedCache(SEARCH_DATA_CACHE_KEY, normalizedData);
    } catch (error) {
      console.log(error);

      if (!cachedData) {
        setProducts([]);

        setActivePromotions([]);

        setActiveFlashSale(null);
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchBannerProducts = async (bannerId, bannerSource = "section") => {
    if (!bannerId) {
      setBannerInfo(null);
      setBannerProducts([]);
      return;
    }

    const cacheKey = `${SEARCH_BANNER_CACHE_PREFIX}${bannerSource}.${bannerId}`;

    const cachedDetail = readTimedCache(cacheKey);

    if (cachedDetail) {
      const normalizedCache = normalizeBannerDetail(cachedDetail);

      setBannerInfo(normalizedCache.banner);

      setBannerProducts(normalizedCache.products);

      setLoadingBanner(false);
    } else {
      setLoadingBanner(true);
    }

    try {
      const detail =
        bannerSource === "home"
          ? await getBannerDetail(bannerId)
          : await getSectionBannerDetail(bannerId);

      const normalizedDetail = normalizeBannerDetail(detail);

      setBannerInfo(normalizedDetail.banner);

      setBannerProducts(normalizedDetail.products);

      writeTimedCache(cacheKey, normalizedDetail);
    } catch (error) {
      console.log(error);

      if (!cachedDetail) {
        setBannerInfo(null);
        setBannerProducts([]);
      }
    } finally {
      setLoadingBanner(false);
    }
  };

  const normalizeText = (value) => {
    const text =
      typeof value === "object" && value !== null
        ? value.name || value.title || value.value || ""
        : value;

    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  };

  const CATEGORY_ALIASES = {
    laptop: ["laptop", "laptop gaming", "may tinh xach tay"],
    "may tinh bang": ["may tinh bang", "tablet", "ipad"],
    "dien thoai": ["dien thoai", "smartphone", "phone"],
    "tai nghe": ["tai nghe", "headphone", "earphone"],
    "phu kien": ["phu kien", "accessory", "phu kien cong nghe"],
    tivi: ["tivi", "tv", "television"],
    "tu lanh": ["tu lanh", "refrigerator"],
    "dong ho thong minh": ["dong ho thong minh", "smartwatch", "watch"],
  };

  const matchesFilterText = (productValue, filterValue, aliases = {}) => {
    const productText = normalizeText(productValue);
    const filterText = normalizeText(filterValue);

    if (!filterText) return true;
    if (!productText) return false;

    if (
      productText === filterText ||
      productText.includes(filterText) ||
      filterText.includes(productText)
    ) {
      return true;
    }

    const aliasList = aliases[filterText] || [];

    return aliasList.some((alias) => {
      const aliasText = normalizeText(alias);

      return (
        productText === aliasText ||
        productText.includes(aliasText) ||
        aliasText.includes(productText)
      );
    });
  };

  const activePromotionByProductId = useMemo(() => {
    const today = new Date();

    return activePromotions.reduce((promotionMap, promotion) => {
      if (!promotion.active) {
        return promotionMap;
      }

      const productId = Number(promotion.productId);

      const startDate = promotion.startDate
        ? new Date(promotion.startDate)
        : null;

      const endDate = promotion.endDate ? new Date(promotion.endDate) : null;

      if (startDate && today < startDate) {
        return promotionMap;
      }

      if (endDate && today > endDate) {
        return promotionMap;
      }

      if (!promotionMap.has(productId)) {
        promotionMap.set(productId, promotion);
      }

      return promotionMap;
    }, new Map());
  }, [activePromotions]);

  const activeFlashSaleItemByProductId = useMemo(() => {
    return (activeFlashSale?.items || []).reduce((flashSaleMap, item) => {
      const salePrice = Number(item.salePrice || 0);

      const originalPrice = Number(item.originalPrice || 0);

      const saleQuantity = Number(item.saleQuantity || 0);

      const soldQuantity = Number(item.soldQuantity || 0);

      const remainingQuantity = Math.max(0, saleQuantity - soldQuantity);

      if (
        salePrice <= 0 ||
        originalPrice <= 0 ||
        salePrice >= originalPrice ||
        remainingQuantity <= 0
      ) {
        return flashSaleMap;
      }

      flashSaleMap.set(Number(item.productId), item);

      return flashSaleMap;
    }, new Map());
  }, [activeFlashSale]);

  const getPromotionForProduct = (productId) => {
    return activePromotionByProductId.get(Number(productId)) || null;
  };

  const getDiscountPrice = (price, discountPercent) => {
    return Math.round(
      (Number(price || 0) * (100 - Number(discountPercent || 0))) / 100,
    );
  };

  const getFlashSaleItemForProduct = (productId) => {
    return activeFlashSaleItemByProductId.get(Number(productId)) || null;
  };

  const getEffectiveSearchPrice = (product) => {
    const productOriginalPrice = Number(product?.price || 0);

    const flashSaleItem = getFlashSaleItemForProduct(product.id);

    if (flashSaleItem) {
      const originalPrice = Number(
        flashSaleItem.originalPrice || productOriginalPrice,
      );

      const finalPrice = Number(flashSaleItem.salePrice);

      const calculatedPercent =
        originalPrice > 0
          ? Math.round(((originalPrice - finalPrice) * 100) / originalPrice)
          : 0;

      return {
        originalPrice,
        finalPrice,
        priceSource: "FLASH_SALE",
        discountPercent:
          Number(flashSaleItem.discountPercent || 0) || calculatedPercent,
        flashSaleItemId: flashSaleItem.itemId,
      };
    }

    const promotion = getPromotionForProduct(product.id);

    if (promotion) {
      const discountPercent = Number(promotion.discountPercent || 0);

      return {
        originalPrice: productOriginalPrice,
        finalPrice: getDiscountPrice(productOriginalPrice, discountPercent),
        priceSource: "PROMOTION",
        discountPercent,
        promotionId: promotion.id,
      };
    }

    return {
      originalPrice: productOriginalPrice,
      finalPrice: productOriginalPrice,
      priceSource: "REGULAR",
      discountPercent: 0,
    };
  };

  const getEffectivePriceValue = (product) =>
    Number(getEffectiveSearchPrice(product).finalPrice || 0);

  const searchResults = useMemo(() => {
    const selectedProductIds = productIdsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id !== "")
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    const filterProducts = (skipCategory = false) => {
      let result = [...products];

      const text = normalizeText(keyword);
      const category = normalizeText(categoryParam);
      const brand = normalizeText(brandParam);
      const minPrice = Number(minPriceParam) || 0;
      const maxPrice = Number(maxPriceParam) || 0;

      /*
       * Dùng cho banner ngang đầu trang.
       * URL dạng: /search?productIds=1,2,3
       */
      if (productIdsParam && selectedProductIds.length > 0) {
        result = result.filter((product) =>
          selectedProductIds.includes(Number(product.id)),
        );
      }

      if (isPromotionPage) {
        result = result.filter((product) =>
          Boolean(getPromotionForProduct(product.id)),
        );
      }

      if (text) {
        result = result.filter((product) => {
          const name = normalizeText(product.name);
          const productCategory = normalizeText(product.category);
          const productBrand = normalizeText(product.brand);

          return (
            name.includes(text) ||
            productCategory.includes(text) ||
            productBrand.includes(text)
          );
        });
      }

      if (category && !skipCategory) {
        result = result.filter((product) =>
          matchesFilterText(product.category, categoryParam, CATEGORY_ALIASES),
        );
      }

      if (brand) {
        result = result.filter((product) =>
          matchesFilterText(product.brand, brandParam),
        );
      }

      if (minPrice > 0) {
        result = result.filter(
          (product) => getEffectivePriceValue(product) >= minPrice,
        );
      }

      if (maxPrice > 0) {
        result = result.filter(
          (product) => getEffectivePriceValue(product) <= maxPrice,
        );
      }

      if (dealParam === "flash-sale") {
        result = result.filter((product) =>
          Boolean(getFlashSaleItemForProduct(product.id)),
        );
      } else if (dealParam === "promotion") {
        result = result.filter((product) =>
          Boolean(getPromotionForProduct(product.id)),
        );
      } else if (dealParam === "active") {
        result = result.filter((product) => {
          const priceInfo = getEffectiveSearchPrice(product);

          return priceInfo.priceSource !== "REGULAR";
        });
      }

      if (stockParam === "in-stock") {
        result = result.filter((product) => Number(product.stock || 0) > 0);
      }

      if (sortParam === "price-asc") {
        result.sort((a, b) => getEffectivePriceValue(a) - getEffectivePriceValue(b));
      }

      if (sortParam === "price-desc") {
        result.sort((a, b) => getEffectivePriceValue(b) - getEffectivePriceValue(a));
      }

      if (sortParam === "newest") {
        result.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
      }

      if (sortParam === "sold-desc") {
        result.sort(
          (a, b) =>
            Number(b.soldQuantity || b.sold || 0) -
            Number(a.soldQuantity || a.sold || 0),
        );
      }

      return result;
    };

    const normalResult = filterProducts(false);

    /*
     * Chỉ fallback brand cho menu danh mục/thương hiệu.
     * Không fallback khi đang xem bannerId hoặc productIds,
     * tránh banner bị hiển thị sai sản phẩm.
     */
    if (
      !isBannerCollection &&
      !productIdsParam &&
      categoryParam &&
      brandParam &&
      normalResult.length === 0
    ) {
      return filterProducts(true);
    }

    return normalResult;
  }, [
    products,
    keyword,
    categoryParam,
    brandParam,
    minPriceParam,
    maxPriceParam,
    sortParam,
    bannerIdParam,
    homeBannerIdParam,
    productIdsParam,
    dealParam,
    stockParam,
    isPromotionPage,
    activePromotions,
    activeFlashSale,
  ]);

  const bannerDisplayProducts = useMemo(() => {
    let result = [...bannerProducts];
    const minPrice = Number(minPriceParam) || 0;
    const maxPrice = Number(maxPriceParam) || 0;

    if (dealParam === "flash-sale") {
      result = result.filter((product) =>
        Boolean(getFlashSaleItemForProduct(product.id)),
      );
    } else if (dealParam === "promotion") {
      result = result.filter((product) =>
        Boolean(getPromotionForProduct(product.id)),
      );
    } else if (dealParam === "active") {
      result = result.filter((product) => {
        const priceInfo = getEffectiveSearchPrice(product);

        return priceInfo.priceSource !== "REGULAR";
      });
    }

    if (stockParam === "in-stock") {
      result = result.filter((product) => Number(product.stock || 0) > 0);
    }

    if (minPrice > 0) {
      result = result.filter(
        (product) => getEffectivePriceValue(product) >= minPrice,
      );
    }

    if (maxPrice > 0) {
      result = result.filter(
        (product) => getEffectivePriceValue(product) <= maxPrice,
      );
    }

    if (sortParam === "price-asc") {
      result.sort((a, b) => getEffectivePriceValue(a) - getEffectivePriceValue(b));
    }

    if (sortParam === "price-desc") {
      result.sort((a, b) => getEffectivePriceValue(b) - getEffectivePriceValue(a));
    }

    if (sortParam === "newest") {
      result.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    }

    if (sortParam === "sold-desc") {
      result.sort(
        (a, b) =>
          Number(b.soldQuantity || b.sold || 0) -
          Number(a.soldQuantity || a.sold || 0),
      );
    }

    return result;
  }, [
    bannerProducts,
    minPriceParam,
    maxPriceParam,
    dealParam,
    stockParam,
    sortParam,
    activePromotions,
    activeFlashSale,
  ]);

  const displayedProducts = isBannerCollection
    ? bannerDisplayProducts
    : searchResults;

  const isSearchLoading =
    loadingProducts || Boolean(isBannerCollection && loadingBanner);

  const visibleProducts = displayedProducts.slice(0, visibleProductCount);

  const hasMoreProducts = visibleProductCount < displayedProducts.length;

  const visibleProgressPercent =
    displayedProducts.length > 0
      ? Math.min(
          100,
          Math.round((visibleProducts.length / displayedProducts.length) * 100),
        )
      : 0;

  useEffect(() => {
    setVisibleProductCount(SEARCH_PAGE_SIZE);
  }, [
    keyword,
    categoryParam,
    brandParam,
    minPriceParam,
    maxPriceParam,
    sortParam,
    bannerIdParam,
    homeBannerIdParam,
    productIdsParam,
    dealParam,
    stockParam,
    pageParam,
  ]);

  const selectedProductIds = productIdsParam
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "");

  const searchModeClass = isBannerCollection
    ? "banner-search-page"
    : productIdsParam
      ? "collection-search-page"
      : isPromotionPage
        ? "promotion-search-page"
        : "standard-search-page";

  const updateSearchParams = (updates) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });

    const nextQuery = nextParams.toString();

    navigate(nextQuery ? `/search?${nextQuery}` : "/search");
  };

  const handleSortChange = (event) => {
    updateSearchParams({
      sort: event.target.value,
    });
  };

  const handlePriceFilterChange = (filter) => {
    updateSearchParams({
      minPrice: filter.minPrice,
      maxPrice: filter.maxPrice,
    });
  };

  const clearCategoryFilters = () => {
    updateSearchParams({
      brand: "",
      minPrice: "",
      maxPrice: "",
      sort: "",
      deal: "",
      stock: "",
    });
  };

  const filterChips = [
    keyword && `Từ khóa: ${keyword}`,
    categoryParam && `Danh mục: ${categoryParam}`,
    brandParam && `Thương hiệu: ${brandParam}`,
    minPriceParam && `Từ ${Number(minPriceParam).toLocaleString("vi-VN")}đ`,
    maxPriceParam && `Đến ${Number(maxPriceParam).toLocaleString("vi-VN")}đ`,
    dealParam === "flash-sale" && "Flash Sale",
    dealParam === "promotion" && "Giảm giá thường",
    dealParam === "active" && "Đang giảm giá",
    stockParam === "in-stock" && "Còn hàng",
    productIdsParam && `Gợi ý chọn lọc: ${selectedProductIds.length}`,
    isBannerCollection && (bannerInfo?.title || "Bộ sưu tập banner"),
    isPromotionPage && "Đang khuyến mãi",
  ].filter(Boolean);

  const searchHeroStats = useMemo(() => {
    const flashSaleCount = displayedProducts.filter((product) =>
      activeFlashSaleItemByProductId.has(Number(product.id)),
    ).length;

    const dealCount = displayedProducts.filter((product) => {
      const productId = Number(product.id);

      return (
        activeFlashSaleItemByProductId.has(productId) ||
        activePromotionByProductId.has(productId)
      );
    }).length;

    const inStockCount = displayedProducts.filter(
      (product) => Number(product.stock || 0) > 0,
    ).length;

    const brandCount = new Set(
      displayedProducts
        .map((product) => String(product.brand || "").trim())
        .filter(Boolean),
    ).size;

    return [
      {
        key: "deal",
        label: "Đang ưu đãi",
        value: dealCount,
      },
      {
        key: "flash",
        label: "Flash Sale",
        value: flashSaleCount,
      },
      {
        key: "stock",
        label: "Còn hàng",
        value: inStockCount,
      },
      {
        key: "brand",
        label: "Thương hiệu",
        value: brandCount,
      },
    ];
  }, [
    displayedProducts,
    activeFlashSaleItemByProductId,
    activePromotionByProductId,
  ]);

  const showSearchSidebar = !isBannerCollection && !productIdsParam;

  const sidebarBaseProducts = useMemo(() => {
    return products.filter((product) => {
      const text = normalizeText(keyword);

      if (text) {
        const name = normalizeText(product.name);
        const productCategory = normalizeText(product.category);
        const productBrand = normalizeText(product.brand);

        if (
          !name.includes(text) &&
          !productCategory.includes(text) &&
          !productBrand.includes(text)
        ) {
          return false;
        }
      }

      if (categoryParam) {
        return matchesFilterText(
          product.category,
          categoryParam,
          CATEGORY_ALIASES,
        );
      }

      return true;
    });
  }, [products, keyword, categoryParam]);

  const availableBrands = useMemo(() => {
    const brandCounts = new Map();

    sidebarBaseProducts.forEach((product) => {
      const brand = String(product.brand || "").trim();

      if (!brand) {
        return;
      }

      brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
    });

    return Array.from(brandCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sidebarBaseProducts]);

  const smartSectionCards = useMemo(() => {
    const flashSaleCount = displayedProducts.filter((product) =>
      Boolean(getFlashSaleItemForProduct(product.id)),
    ).length;

    const dealCount = displayedProducts.filter((product) => {
      const priceInfo = getEffectiveSearchPrice(product);

      return priceInfo.priceSource !== "REGULAR";
    }).length;

    const bestSellerCount = displayedProducts.filter(
      (product) => Number(product.soldQuantity || product.sold || 0) > 0,
    ).length;

    return [
      {
        key: "all",
        title: "Tất cả sản phẩm",
        description: "Xem toàn bộ kết quả phù hợp",
        count: displayedProducts.length,
        active: !dealParam && !stockParam && sortParam !== "sold-desc",
        onClick: () =>
          updateSearchParams({
            deal: "",
            stock: "",
            sort: "",
          }),
      },
      {
        key: "flash",
        title: "Đang Flash Sale",
        description: "Ưu tiên sản phẩm có giá sốc",
        count: flashSaleCount,
        active: dealParam === "flash-sale",
        onClick: () =>
          updateSearchParams({
            deal: "flash-sale",
          }),
      },
      {
        key: "best-seller",
        title: "Bán chạy",
        description: "Sắp xếp theo số lượng đã bán",
        count: bestSellerCount,
        active: sortParam === "sold-desc",
        onClick: () =>
          updateSearchParams({
            sort: "sold-desc",
          }),
      },
      {
        key: "good-price",
        title: "Giá tốt",
        description: "Sản phẩm đang có ưu đãi",
        count: dealCount,
        active: dealParam === "active",
        onClick: () =>
          updateSearchParams({
            deal: "active",
          }),
      },
    ];
  }, [
    displayedProducts,
    activeFlashSale,
    activePromotions,
    dealParam,
    stockParam,
    sortParam,
  ]);

  const quickFilterPills = useMemo(() => {
    const baseProducts = isBannerCollection ? bannerProducts : displayedProducts;

    const flashSaleCount = baseProducts.filter((product) =>
      Boolean(getFlashSaleItemForProduct(product.id)),
    ).length;

    const dealCount = baseProducts.filter((product) => {
      const priceInfo = getEffectiveSearchPrice(product);

      return priceInfo.priceSource !== "REGULAR";
    }).length;

    const bestSellerCount = baseProducts.filter(
      (product) => Number(product.soldQuantity || product.sold || 0) > 0,
    ).length;

    const inStockCount = baseProducts.filter(
      (product) => Number(product.stock || 0) > 0,
    ).length;

    return [
      {
        key: "all",
        label: "Tất cả",
        count: baseProducts.length,
        active: !dealParam && !stockParam && sortParam !== "sold-desc",
        onClick: () =>
          updateSearchParams({
            deal: "",
            stock: "",
            sort: "",
          }),
      },
      {
        key: "flash",
        label: "Flash Sale",
        count: flashSaleCount,
        active: dealParam === "flash-sale",
        onClick: () =>
          updateSearchParams({
            deal: dealParam === "flash-sale" ? "" : "flash-sale",
          }),
      },
      {
        key: "deal",
        label: "Đang giảm giá",
        count: dealCount,
        active: dealParam === "active",
        onClick: () =>
          updateSearchParams({
            deal: dealParam === "active" ? "" : "active",
          }),
      },
      {
        key: "best-seller",
        label: "Bán chạy",
        count: bestSellerCount,
        active: sortParam === "sold-desc",
        onClick: () =>
          updateSearchParams({
            sort: sortParam === "sold-desc" ? "" : "sold-desc",
          }),
      },
      {
        key: "stock",
        label: "Còn hàng",
        count: inStockCount,
        active: stockParam === "in-stock",
        onClick: () =>
          updateSearchParams({
            stock: stockParam === "in-stock" ? "" : "in-stock",
          }),
      },
    ];
  }, [
    isBannerCollection,
    bannerProducts,
    displayedProducts,
    activeFlashSale,
    activePromotions,
    dealParam,
    stockParam,
    sortParam,
  ]);

  const showCollectionTools = Boolean(isBannerCollection || productIdsParam);

  const getResultDescription = () => {
    if (isBannerCollection) {
      return (
        <>
          Sản phẩm thuộc chương trình:
          <strong> {bannerInfo?.title || "Banner khuyến mãi"}</strong>
        </>
      );
    }

    if (keyword) {
      return (
        <>
          Kết quả cho từ khóa:
          <strong> {keyword}</strong>
        </>
      );
    }

    if (
      categoryParam ||
      brandParam ||
      minPriceParam ||
      maxPriceParam ||
      sortParam ||
      dealParam ||
      stockParam
    ) {
      return (
        <>
          Kết quả theo bộ lọc:
          <strong>
            {" "}
            {categoryParam || "Tất cả danh mục"}
            {brandParam ? ` - ${brandParam}` : ""}
          </strong>
        </>
      );
    }

    return <>Chưa có từ khóa hoặc bộ lọc</>;
  };

  const getPageTitle = () => {
    if (isBannerCollection) {
      return bannerInfo?.title || "Bộ sưu tập sản phẩm nổi bật";
    }

    if (productIdsParam) {
      return "Gợi ý nổi bật từ ElectroShop";
    }

    if (isPromotionPage) {
      return "Ưu đãi công nghệ đang diễn ra";
    }

    return `Tìm thấy ${displayedProducts.length} sản phẩm phù hợp`;
  };

  const getPageSubtitle = () => {
    if (isBannerCollection) {
      return (
        bannerInfo?.subtitle ||
        "Khám phá những sản phẩm được ElectroShop chọn lọc riêng cho chương trình này."
      );
    }

    if (productIdsParam) {
      return "Những lựa chọn đáng chú ý được ElectroShop gợi ý riêng từ banner trang chủ.";
    }

    if (isPromotionPage) {
      return "Tổng hợp các sản phẩm đang có ưu đãi tốt nhất tại ElectroShop.";
    }

    return getResultDescription();
  };

  return (
    <div className={`search-page ${searchModeClass}`}>
      <Header />

      <div className="search-breadcrumb">
        <Link to="/">Trang chủ</Link>

        <span>›</span>

        <strong>
          {isBannerCollection
            ? "Bộ sưu tập"
            : isPromotionPage
              ? "Khuyến mãi"
              : "Tìm kiếm"}
        </strong>
      </div>

      {isBannerCollection && loadingBanner && (
        <section className="search-banner-hero search-banner-loading">
          <div className="search-skeleton-line wide"></div>
          <div className="search-skeleton-line medium"></div>
          <div className="search-skeleton-line short"></div>
        </section>
      )}

      {isBannerCollection && !loadingBanner && (
        <section className="search-banner-hero">
          {bannerInfo?.imageUrl && (
            <img
              src={bannerInfo.imageUrl}
              alt={bannerInfo.title || "Banner khuyến mãi"}
            />
          )}
        </section>
      )}

      {isBannerCollection && !loadingBanner && (
        <section className="search-collection-summary">
          <div>
            <span>ElectroShop Collection</span>
            <h1>{bannerInfo?.title || "Bộ sưu tập nổi bật"}</h1>
            <p>
              {bannerInfo?.subtitle ||
                "Những sản phẩm được chọn lọc riêng cho chương trình ưu đãi này."}
            </p>
          </div>

          <div className="search-collection-metrics">
            {searchHeroStats.slice(0, 3).map((stat) => (
              <span key={stat.key}>
                <strong>{stat.value}</strong>
                <small>{stat.label}</small>
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="search-result-wrapper">
        <div className="search-result-title">
          <div className="search-result-title-left">
            <div className="search-result-kicker-row">
              <span className="search-result-badge">
              {isBannerCollection
                ? "Bộ sưu tập nổi bật"
                : productIdsParam
                  ? "Collection từ ElectroShop"
                  : "Kết quả tìm kiếm"}
              </span>

              {filterChips.length > 0 && (
                <span className="search-result-filter-count">
                  {filterChips.length} bộ lọc đang áp dụng
                </span>
              )}
            </div>

            <h2>{getPageTitle()}</h2>

            <p>{getPageSubtitle()}</p>

            {!isSearchLoading && displayedProducts.length > 0 && (
              <div className="search-result-stats">
                {searchHeroStats.map((stat) => (
                  <span className="search-result-stat" key={stat.key}>
                    <strong>{stat.value}</strong>
                    <small>{stat.label}</small>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="search-result-title-right">
            <span className="search-result-count">
              {isSearchLoading
                ? "Đang tải sản phẩm"
                : `${displayedProducts.length} sản phẩm`}
            </span>

            {!isSearchLoading && displayedProducts.length > 0 && (
              <a className="search-result-jump" href="#search-products">
                Xem danh sách
              </a>
            )}
          </div>
        </div>

        {showCollectionTools && !isSearchLoading && displayedProducts.length > 0 && (
          <div className="search-quick-filter-pills">
            {quickFilterPills.map((pill) => (
              <button
                key={pill.key}
                type="button"
                className={pill.active ? "active" : ""}
                disabled={pill.count === 0}
                onClick={pill.onClick}
              >
                <span>{pill.label}</span>
                <strong>{pill.count}</strong>
              </button>
            ))}
          </div>
        )}

        <div className="search-filter-bar">
          <div className="search-filter-summary">
            <strong>
              {isSearchLoading
                ? "Đang tải danh sách sản phẩm..."
                : `Đang hiển thị ${visibleProducts.length} / ${displayedProducts.length} sản phẩm`}
            </strong>

            <div className="search-filter-chips">
              {filterChips.length > 0 ? (
                filterChips.map((chip) => <span key={chip}>{chip}</span>)
              ) : (
                <span>Tất cả sản phẩm</span>
              )}
            </div>
          </div>

          <label className="search-sort-select">
            <span>Sắp xếp</span>

            <select value={sortParam} onChange={handleSortChange}>
              <option value="">Mặc định</option>
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="sold-desc">Bán chạy</option>
            </select>
          </label>
        </div>

        {showSearchSidebar && !isSearchLoading && displayedProducts.length > 0 && (
          <div className="search-smart-sections">
            {smartSectionCards.map((section) => (
              <button
                key={section.key}
                type="button"
                className={section.active ? "active" : ""}
                disabled={section.count === 0}
                onClick={section.onClick}
              >
                <span>{section.title}</span>
                <strong>{section.count}</strong>
                <small>{section.description}</small>
              </button>
            ))}
          </div>
        )}

        <div
          className={
            showSearchSidebar
              ? "search-content-layout has-sidebar"
              : "search-content-layout"
          }
        >
          {showSearchSidebar && (
            <aside className="search-filter-sidebar">
              <div className="search-sidebar-head">
                <strong>Bộ lọc sản phẩm</strong>
                <button type="button" onClick={clearCategoryFilters}>
                  Xóa lọc
                </button>
              </div>

              <div className="search-sidebar-group">
                <h3>Thương hiệu</h3>

                <div className="search-sidebar-options">
                  {availableBrands.length > 0 ? (
                    availableBrands.map((brand) => (
                      <button
                        key={brand.name}
                        type="button"
                        className={brandParam === brand.name ? "active" : ""}
                        onClick={() =>
                          updateSearchParams({
                            brand: brandParam === brand.name ? "" : brand.name,
                          })
                        }
                      >
                        <span>{brand.name}</span>
                        <small>{brand.count}</small>
                      </button>
                    ))
                  ) : (
                    <p>Chưa có thương hiệu phù hợp</p>
                  )}
                </div>
              </div>

              <div className="search-sidebar-group">
                <h3>Khoảng giá</h3>

                <div className="search-sidebar-options">
                  {PRICE_FILTERS.map((filter) => {
                    const isActive =
                      minPriceParam === filter.minPrice &&
                      maxPriceParam === filter.maxPrice;

                    return (
                      <button
                        key={filter.label}
                        type="button"
                        className={isActive ? "active" : ""}
                        onClick={() =>
                          isActive
                            ? updateSearchParams({
                                minPrice: "",
                                maxPrice: "",
                              })
                            : handlePriceFilterChange(filter)
                        }
                      >
                        <span>{filter.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="search-sidebar-group">
                <h3>Ưu tiên hiển thị</h3>

                <div className="search-sidebar-options">
                  <button
                    type="button"
                    className={dealParam === "active" ? "active" : ""}
                    onClick={() =>
                      updateSearchParams({
                        deal: dealParam === "active" ? "" : "active",
                      })
                    }
                  >
                    <span>Đang giảm giá</span>
                  </button>

                  <button
                    type="button"
                    className={dealParam === "flash-sale" ? "active" : ""}
                    onClick={() =>
                      updateSearchParams({
                        deal:
                          dealParam === "flash-sale" ? "" : "flash-sale",
                      })
                    }
                  >
                    <span>Flash Sale</span>
                  </button>

                  <button
                    type="button"
                    className={stockParam === "in-stock" ? "active" : ""}
                    onClick={() =>
                      updateSearchParams({
                        stock:
                          stockParam === "in-stock" ? "" : "in-stock",
                      })
                    }
                  >
                    <span>Còn hàng</span>
                  </button>
                </div>
              </div>
            </aside>
          )}

          <div className="search-products-area">
            {isSearchLoading ? (
              <div className="search-loading-grid">
                {Array.from({ length: SEARCH_PAGE_SIZE }).map((_, index) => (
                  <div className="search-product-skeleton" key={index}>
                    <div></div>
                    <span></span>
                    <strong></strong>
                    <small></small>
                  </div>
                ))}
              </div>
            ) : displayedProducts.length > 0 ? (
              <>
                <div className="search-product-grid" id="search-products">
                  {visibleProducts.map((product) => {
                    const priceInfo = getEffectiveSearchPrice(product);

                    return (
                      <HomeProductCard
                        key={product.id}
                        product={product}
                        priceInfo={priceInfo}
                        onOpen={() => navigate(`/product/${product.id}`)}
                      />
                    );
                  })}
                </div>

                {hasMoreProducts && (
                  <div className="search-load-more">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleProductCount((current) =>
                          Math.min(
                            current + SEARCH_PAGE_SIZE,
                            displayedProducts.length,
                          ),
                        )
                      }
                    >
                      Xem thêm{" "}
                      {Math.min(
                        SEARCH_PAGE_SIZE,
                        displayedProducts.length - visibleProductCount,
                      )}{" "}
                      sản phẩm
                    </button>

                    <span>
                      Còn {displayedProducts.length - visibleProductCount} sản
                      phẩm chưa hiển thị
                    </span>

                    <div
                      className="search-load-progress"
                      aria-hidden="true"
                    >
                      <span
                        style={{
                          width: `${visibleProgressPercent}%`,
                        }}
                      ></span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="search-empty-page">
                <div className="search-empty-icon">🔍</div>

                <h3>Không tìm thấy sản phẩm phù hợp</h3>

                <p>
                  {isBannerCollection
                    ? "Banner này chưa được gắn sản phẩm. Hãy vào Admin → Trang chủ → Quản lý banner để chọn sản phẩm."
                    : "Hãy thử tìm bằng tên sản phẩm, danh mục, thương hiệu hoặc khoảng giá khác."}
                </p>

                <div className="search-empty-actions">
                  <Link to="/">Về trang chủ</Link>

                  {!isBannerCollection && (
                    <Link to="/search?page=promotion">Xem khuyến mãi</Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
