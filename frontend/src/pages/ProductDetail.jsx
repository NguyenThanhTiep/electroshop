import "./ProductDetail.css";

import { getImageUrl } from "../utils/imageUtils";

import ProductCard from "../components/ProductCard";

import ProductReviews from "../components/ProductReviews";

import Header from "../components/Header";

import { useEffect, useRef, useState } from "react";

import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { addToCart } from "../utils/cartUtils";

import { getProductById, getProducts } from "../services/productApi";

import { getActiveFlashSaleProduct } from "../services/flashSaleApi";

import { getActivePromotions } from "../services/promotionApi";
export default function ProductDetail() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState({});

  const [activeFlashSaleProduct, setActiveFlashSaleProduct] = useState(null);

  const [activePromotion, setActivePromotion] = useState(null);

  const [selectedImage, setSelectedImage] = useState("");

  const [relatedProducts, setRelatedProducts] = useState([]);

  const [showFullscreen, setShowFullscreen] = useState(false);

  const [quantity, setQuantity] = useState(1);

  const detailInfoRef = useRef(null);

  const detailContainerRef = useRef(null);

  const [selectedOptions, setSelectedOptions] = useState({});

  const [showAllOptions, setShowAllOptions] = useState(false);

  const [activeTab, setActiveTab] = useState("description");

  const [thumbStart, setThumbStart] = useState(0);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");

    if (requestedTab === "reviews") {
      setActiveTab("reviews");
    }
  }, [searchParams]);
  const parseJsonArray = (data) => {
    try {
      if (!data) {
        return [];
      }

      if (Array.isArray(data)) {
        return data;
      }

      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  };
  const convertPriceToNumber = (price) => {
    if (price === null || price === undefined || price === "") {
      return 0;
    }

    if (typeof price === "number") {
      return price;
    }

    return Number(String(price).replace(/\D/g, "")) || 0;
  };

  const formatPrice = (price) => {
    return convertPriceToNumber(price).toLocaleString("vi-VN") + "đ";
  };

  const specifications = parseJsonArray(product.specifications);

  const highlights = parseJsonArray(product.highlights);

  const promotions = parseJsonArray(product.promotions);
  const productOptions = parseJsonArray(product.options);

  const findActivePromotion = (promotionList, productId) => {
    const today = new Date();

    return (
      promotionList.find((promotion) => {
        if (!promotion.active) {
          return false;
        }

        if (Number(promotion.productId) !== Number(productId)) {
          return false;
        }

        const startDate = promotion.startDate
          ? new Date(promotion.startDate)
          : null;

        const endDate = promotion.endDate ? new Date(promotion.endDate) : null;

        if (startDate && today < startDate) {
          return false;
        }

        if (endDate && today > endDate) {
          return false;
        }

        return true;
      }) || null
    );
  };

  const calculateRegularPrice = () => {
    const basePrice = convertPriceToNumber(product.price);

    const selectedPrices = Object.values(selectedOptions || {})
      .map((option) => convertPriceToNumber(option?.price))
      .filter((price) => price > 0);

    if (selectedPrices.length === 0) {
      return basePrice;
    }

    return Math.max(basePrice, ...selectedPrices);
  };

  const regularPrice = calculateRegularPrice();

  const baseProductPrice = convertPriceToNumber(product.price);

  const flashSalePrice = convertPriceToNumber(
    activeFlashSaleProduct?.salePrice,
  );

  const promotionPercent = Number(activePromotion?.discountPercent || 0);

  let finalPrice = regularPrice;

  let priceSource = "REGULAR";

  /*
   * Ưu tiên Flash Sale.
   *
   * Flash Sale hiện chỉ áp dụng cho
   * cấu hình giá gốc của sản phẩm.
   */
  if (
    activeFlashSaleProduct &&
    flashSalePrice > 0 &&
    flashSalePrice < baseProductPrice &&
    regularPrice === baseProductPrice
  ) {
    finalPrice = flashSalePrice;

    priceSource = "FLASH_SALE";
  }

  /*
   * Nếu không áp dụng Flash Sale,
   * mới dùng Promotion.
   */
  if (
    priceSource === "REGULAR" &&
    activePromotion &&
    promotionPercent > 0 &&
    promotionPercent < 100
  ) {
    finalPrice = Math.round((regularPrice * (100 - promotionPercent)) / 100);

    priceSource = "PROMOTION";
  }

  const discountPercent =
    priceSource === "FLASH_SALE"
      ? Number(activeFlashSaleProduct?.discountPercent || 0)
      : priceSource === "PROMOTION"
        ? promotionPercent
        : 0;

  const savedAmount = Math.max(0, regularPrice - finalPrice);

  const visibleOptions = showAllOptions
    ? productOptions
    : productOptions.slice(0, 2);

  /* ALL IMAGES */

  const allImages = [
    getImageUrl(product.image),

    ...(product.images?.map((img) => getImageUrl(img.imageUrl)) || []),
  ].filter(Boolean);
  const visibleThumbs = allImages.slice(thumbStart, thumbStart + 3);
  /* CURRENT IMAGE INDEX */

  const currentIndex = allImages.indexOf(selectedImage);

  /* FETCH PRODUCT */

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (productOptions.length === 0) {
      return;
    }

    const defaultSelectedOptions = {};

    productOptions.forEach((group) => {
      const validValues = group.values?.filter((value) => value.name) || [];

      if (group.groupName && validValues.length > 0) {
        defaultSelectedOptions[group.groupName] = validValues[0];
      }
    });

    setSelectedOptions(defaultSelectedOptions);
  }, [product.options]);

  useEffect(() => {
    const container = detailContainerRef.current;

    const detailInfo = detailInfoRef.current;

    if (!container || !detailInfo) {
      return;
    }

    let targetScroll = detailInfo.scrollTop;

    let animationFrameId = null;

    const smoothScrollTo = (target) => {
      const start = detailInfo.scrollTop;

      const distance = target - start;

      const duration = 180;

      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;

        const progress = Math.min(elapsed / duration, 1);

        const ease = 1 - Math.pow(1 - progress, 3);

        detailInfo.scrollTop = start + distance * ease;

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        }
      };

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleWheel = (e) => {
      const scrollingDown = e.deltaY > 0;

      const scrollingUp = e.deltaY < 0;

      const maxScroll = detailInfo.scrollHeight - detailInfo.clientHeight;

      const canScrollDown = detailInfo.scrollTop < maxScroll - 2;

      const canScrollUp = detailInfo.scrollTop > 2;

      if (scrollingDown && canScrollDown) {
        e.preventDefault();

        e.stopPropagation();

        targetScroll = Math.min(maxScroll, targetScroll + e.deltaY * 0.9);

        smoothScrollTo(targetScroll);

        return;
      }

      if (scrollingUp && canScrollUp) {
        e.preventDefault();

        e.stopPropagation();

        targetScroll = Math.max(0, targetScroll + e.deltaY * 1.05);

        smoothScrollTo(targetScroll);

        return;
      }

      targetScroll = detailInfo.scrollTop;
    };

    container.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      container.removeEventListener("wheel", handleWheel);

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [product, showAllOptions]);
  const fetchProduct = async () => {
    try {
      const [productData, flashSaleData, promotionData, allProducts] =
        await Promise.all([
          getProductById(id),

          getActiveFlashSaleProduct(id),

          getActivePromotions(),

          getProducts(),
        ]);

      setProduct(productData);

      setActiveFlashSaleProduct(flashSaleData || null);

      setActivePromotion(
        findActivePromotion(
          Array.isArray(promotionData) ? promotionData : [],
          productData.id,
        ),
      );

      setSelectedImage(getImageUrl(productData.image));

      setQuantity(1);
      setThumbStart(0);

      const filteredProducts = allProducts.filter(
        (item) =>
          item.category === productData.category && item.id !== productData.id,
      );

      setRelatedProducts(filteredProducts.slice(0, 12));
    } catch (error) {
      console.error("Không thể tải sản phẩm:", error);

      setActiveFlashSaleProduct(null);
      setActivePromotion(null);
    }
  };

  const buildCartProduct = () => {
    const cartProduct = {
      ...product,

      productId: product.id,

      basePrice: product.price,

      originalPrice: regularPrice,

      price: finalPrice,

      effectivePrice: finalPrice,

      priceSource,

      isFlashSale: priceSource === "FLASH_SALE",

      flashSalePrice: priceSource === "FLASH_SALE" ? finalPrice : null,

      flashSaleItemId:
        priceSource === "FLASH_SALE" ? activeFlashSaleProduct?.itemId : null,

      isPromotion: priceSource === "PROMOTION",

      promotionId: priceSource === "PROMOTION" ? activePromotion?.id : null,

      discountPercent,

      quantity: Number(quantity || 1),

      selectedOptions: {
        ...selectedOptions,
      },
    };

    return cartProduct;
  };

  const validatePurchase = () => {
    if (!product?.id) {
      alert("Không tìm thấy thông tin sản phẩm");

      return false;
    }

    const stock = Number(product.stock || 0);

    if (stock <= 0) {
      alert("Sản phẩm hiện đã hết hàng");

      return false;
    }

    if (quantity < 1) {
      alert("Số lượng mua không hợp lệ");

      return false;
    }

    if (quantity > stock) {
      alert(`Sản phẩm chỉ còn ${stock} sản phẩm`);

      return false;
    }

    const missingOption = productOptions.find((group) => {
      const validValues = group.values?.filter((value) => value.name) || [];

      return (
        group.groupName &&
        validValues.length > 0 &&
        !selectedOptions[group.groupName]
      );
    });

    if (missingOption) {
      alert(`Vui lòng chọn ${missingOption.groupName}`);

      return false;
    }

    return true;
  };

  const handleBuyNow = () => {
    if (!validatePurchase()) {
      return;
    }

    const cartProduct = buildCartProduct();

    addToCart(cartProduct);

    sessionStorage.setItem("checkoutSource", "BUY_NOW");

    const token = localStorage.getItem("token");

    if (!token) {
      sessionStorage.setItem("redirectAfterLogin", "/checkout");

      navigate("/login");

      return;
    }

    navigate("/checkout");
  };

  const handleAddToCart = () => {
    if (!validatePurchase()) {
      return;
    }

    const cartProduct = buildCartProduct();

    addToCart(cartProduct);

    alert("Đã thêm vào giỏ hàng");
  };

  return (
    <>
      <Header />

      <div className="product-detail-page">
        <div className="product-detail-container" ref={detailContainerRef}>
          {/* LEFT */}

          <div className="product-gallery">
            {/* MAIN IMAGE */}

            <div className="main-image">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt={product.name}
                  onClick={() => setShowFullscreen(true)}
                />
              )}
            </div>

            {/* THUMBNAILS */}

            {/* THUMBNAILS */}

            <div className="thumbnail-wrapper">
              {/* LEFT BUTTON */}

              <button
                className="thumb-btn left"
                onClick={() => {
                  if (thumbStart > 0) {
                    const newStart = thumbStart - 1;

                    setThumbStart(newStart);

                    setSelectedImage(allImages[newStart]);
                  }
                }}
              >
                ❮
              </button>

              {/* THUMBNAIL LIST */}

              <div className="thumbnail-list">
                {visibleThumbs.map((imageUrl, index) => (
                  <img
                    key={thumbStart + index}
                    src={imageUrl}
                    alt=""
                    onClick={() => setSelectedImage(imageUrl)}
                    className={selectedImage === imageUrl ? "active-thumb" : ""}
                  />
                ))}
              </div>

              {/* RIGHT BUTTON */}

              <button
                className="thumb-btn right"
                onClick={() => {
                  if (thumbStart < allImages.length - 3) {
                    const newStart = thumbStart + 1;

                    setThumbStart(newStart);

                    setSelectedImage(allImages[newStart]);
                  }
                }}
              >
                ❯
              </button>
            </div>
          </div>

          {/* CENTER INFO */}

          <div className="product-detail-info" ref={detailInfoRef}>
            <span className="product-category">{product.category}</span>

            <h1>{product.name}</h1>

            <div className="product-brand-row">
              <span>Thương hiệu: {product.brand || "ElectroShop"}</span>

              <span>|</span>

              <span>
                Tình trạng: {product.stock > 0 ? "Còn hàng" : "Hết hàng"}
              </span>
            </div>

            <div className="product-meta">
              <span>⭐ 4.9</span>

              <span>
                • Đã bán {Number(activeFlashSaleProduct?.soldQuantity || 0)}
              </span>

              <span>• Còn lại {product.stock || 0}</span>
            </div>

            <div className="product-price-row">
              <span className="price-label">Giá:</span>

              <span className="product-price">{formatPrice(finalPrice)}</span>

              {priceSource !== "REGULAR" && (
                <span className="product-flash-badge">
                  {priceSource === "FLASH_SALE"
                    ? `⚡ Flash Sale -${discountPercent}%`
                    : `🏷 Giảm ${discountPercent}%`}
                </span>
              )}
            </div>

            {priceSource !== "REGULAR" ? (
              <div className="market-price-row">
                <span>Giá gốc:</span>

                <del>{formatPrice(regularPrice)}</del>

                <span>Tiết kiệm:</span>

                <strong>{formatPrice(savedAmount)}</strong>
              </div>
            ) : (
              <div className="market-price-row">
                <span>Giá thị trường:</span>

                <del>{Number(finalPrice * 1.15).toLocaleString("vi-VN")}đ</del>

                <span>Tiết kiệm:</span>

                <strong>
                  {Number(finalPrice * 0.15).toLocaleString("vi-VN")}đ
                </strong>
              </div>
            )}

            <div className="variant-box">
              <p>
                Phân loại:
                <strong> Chính hãng</strong>
              </p>
            </div>

            {/* TÙY CHỌN SẢN PHẨM */}

            {productOptions.length > 0 && (
              <div className="product-options-wrapper">
                {visibleOptions
                  .filter(
                    (group) =>
                      group.groupName &&
                      group.values?.some((item) => item.name),
                  )
                  .map((group, groupIndex) => {
                    const validValues = group.values.filter(
                      (item) => item.name,
                    );

                    return (
                      <div className="product-option-group" key={groupIndex}>
                        <h3>{group.groupName}</h3>

                        <div className="product-option-list">
                          {validValues.map((item, itemIndex) => {
                            const isActive =
                              selectedOptions[group.groupName]?.name ===
                              item.name;

                            return (
                              <button
                                type="button"
                                key={itemIndex}
                                className={
                                  isActive
                                    ? "product-option-item active"
                                    : "product-option-item"
                                }
                                onClick={() => {
                                  setSelectedOptions({
                                    ...selectedOptions,

                                    [group.groupName]: item,
                                  });
                                }}
                              >
                                <span className="option-name">{item.name}</span>

                                {item.price && (
                                  <span className="option-price">
                                    {formatPrice(item.price)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                {productOptions.length > 2 && (
                  <button
                    type="button"
                    className="show-more-options-btn"
                    onClick={() => setShowAllOptions(!showAllOptions)}
                  >
                    {showAllOptions ? "Thu gọn tùy chọn" : "Xem thêm tùy chọn"}
                  </button>
                )}
              </div>
            )}

            <div className="quantity-title">Số lượng:</div>

            <div className="quantity-box product-quantity-center">
              <button
                onClick={() => {
                  if (quantity > 1) {
                    setQuantity(quantity - 1);
                  }
                }}
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                onClick={() => {
                  if (quantity < (product.stock || 0)) {
                    setQuantity(quantity + 1);
                  }
                }}
              >
                +
              </button>
            </div>

            <div className="main-buy-actions">
              <button
                type="button"
                className="main-buy-btn"
                onClick={handleBuyNow}
                disabled={!product?.id || Number(product.stock || 0) <= 0}
              >
                🛒 MUA NGAY
                <span>Giao hàng tận nơi hoặc nhận tại cửa hàng</span>
              </button>

              <button
                type="button"
                className="outline-cart-btn full-cart-btn"
                onClick={handleAddToCart}
                disabled={!product?.id || Number(product.stock || 0) <= 0}
              >
                {Number(product.stock || 0) > 0
                  ? "THÊM VÀO GIỎ HÀNG"
                  : "SẢN PHẨM ĐÃ HẾT HÀNG"}
              </button>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}

          <div className="product-side-panel">
            <div className="side-policy-box">
              <h3>CHÍNH SÁCH CỦA CHÚNG TÔI</h3>

              <div className="side-policy-item">
                <span>🚚</span>

                <p>Giao hàng tận nơi - Nhận hàng trả tiền</p>
              </div>

              <div className="side-policy-item">
                <span>🎧</span>

                <p>Tư vấn chu đáo - Hỗ trợ nhanh 24/7</p>
              </div>

              <div className="side-policy-item">
                <span>🔄</span>

                <p>1 đổi 1 nếu sản phẩm lỗi</p>
              </div>
            </div>

            <div className="side-suggest-box">
              <h3>CÓ THỂ BẠN THÍCH</h3>

              {relatedProducts
                .filter((item) => item.category === product.category)
                .slice(0, 3)
                .map((item) => (
                  <Link
                    to={`/product/${item.id}`}
                    className="side-suggest-item"
                    key={item.id}
                  >
                    {item.image && <img src={item.image} alt={item.name} />}

                    <div>
                      <p>{item.name}</p>

                      <strong>
                        {Number(item.price || 0).toLocaleString("vi-VN")}đ
                      </strong>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>

        {/* PRODUCT DETAIL CONTENT */}

        <div className="detail-content-section">
          <div className="detail-tabs">
            <button
              type="button"
              className={activeTab === "description" ? "active" : ""}
              onClick={() => setActiveTab("description")}
            >
              MÔ TẢ SẢN PHẨM
            </button>

            <button
              type="button"
              className={activeTab === "policy" ? "active" : ""}
              onClick={() => setActiveTab("policy")}
            >
              CHÍNH SÁCH ĐỔI TRẢ
            </button>

            <button
              type="button"
              className={activeTab === "reviews" ? "active" : ""}
              onClick={() => setActiveTab("reviews")}
            >
              ĐÁNH GIÁ
            </button>
          </div>

          {activeTab === "description" && (
            <>
              <div className="detail-content-grid">
                {/* MÔ TẢ */}

                <div className="detail-content-card">
                  <h3>MÔ TẢ SẢN PHẨM</h3>

                  <p>{product.description}</p>
                </div>

                {/* THÔNG SỐ */}

                <div className="detail-content-card">
                  <h3>THÔNG SỐ KỸ THUẬT</h3>

                  <div className="specification-table">
                    {specifications
                      .filter((spec) => spec.key || spec.value)
                      .map((spec, index) => (
                        <div className="specification-row" key={index}>
                          <span>{spec.key}</span>

                          <strong>{spec.value}</strong>
                        </div>
                      ))}
                  </div>
                </div>

                {/* ĐIỂM NỔI BẬT */}

                <div className="detail-content-card">
                  <h3>ĐIỂM NỔI BẬT</h3>

                  <div className="highlight-list">
                    {highlights
                      .filter((item) => item.title || item.description)
                      .map((item, index) => (
                        <div className="highlight-detail-item" key={index}>
                          <span>{item.icon}</span>

                          <div>
                            <strong>{item.title}</strong>

                            <p>{item.description}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* ƯU ĐÃI */}

              <div className="promotion-detail-section">
                <h3>ƯU ĐÃI KHI MUA HÀNG</h3>

                <div className="promotion-detail-list">
                  {promotions
                    .filter((item) => item.title || item.description)
                    .map((item, index) => (
                      <div className="promotion-detail-item" key={index}>
                        <span>{item.icon}</span>

                        <div>
                          <strong>{item.title}</strong>

                          <p>{item.description}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "policy" && (
            <div className="return-policy-content">
              <h3>CHÍNH SÁCH ĐỔI – BÁN LẠI SẢN PHẨM:</h3>

              <h4>I. ĐỔI MỚI SẢN PHẨM:</h4>

              <p>
                - Thời gian: trong 15 ngày đầu tiên. Chỉ áp dụng 1 lần và không
                áp dụng cho hình thức trả góp.
              </p>

              <p>- Điều kiện: sản phẩm có lỗi từ nhà sản xuất.</p>

              <p>
                - Lưu ý: Chỉ bao test tại chỗ đối với các vấn đề ngoại hình, màn
                hình có nứt kính, cấn móp, trầy xước hay không. Sau khi ra khỏi
                shop sẽ không được hỗ trợ về các vấn đề này.
              </p>

              <p>
                - Nếu sản phẩm không phù hợp với nhu cầu sử dụng trong 15 ngày
                đầu, Quý khách có thể yêu cầu đổi sang sản phẩm khác có giá trị
                cao hơn sản phẩm hiện tại và bị trừ phí sử dụng theo quy định.
              </p>

              <h4>II. BÁN LẠI SẢN PHẨM:</h4>

              <p>
                Trong 15 ngày đầu, khách hàng có thể trả hoặc bán lại sản phẩm.
                Giá trị thu lại sẽ được tính theo tình trạng máy, hóa đơn và phụ
                kiện đi kèm.
              </p>

              <p>
                Lưu ý: Máy đổi trả phải giữ nguyên hiện trạng ban đầu, không có
                dấu hiệu tháo mở, cấn móp, rơi vỡ, vào nước, dính tài khoản, mất
                vân tay hoặc mất FaceID nếu có.
              </p>

              <h3>CHÍNH SÁCH BẢO HÀNH:</h3>

              <h4>I. CHÍNH SÁCH BẢO HÀNH:</h4>

              <p>
                Thời gian bao test: 15 ngày, sản phẩm sẽ được hỗ trợ 1 đổi 1 nếu
                có lỗi từ nhà sản xuất.
              </p>

              <p>
                Thời gian bảo hành: tùy theo từng sản phẩm và tình trạng sản
                phẩm. Laptop, PC, linh kiện, phụ kiện sẽ áp dụng theo chính sách
                bảo hành của cửa hàng hoặc hãng.
              </p>

              <p>
                Quyền lợi bảo hành: Hỗ trợ sửa chữa hoặc thay thế linh kiện miễn
                phí nếu sản phẩm phát sinh lỗi phần cứng do nhà sản xuất.
              </p>

              <h4>II. ĐIỀU KIỆN TỪ CHỐI BẢO HÀNH:</h4>

              <p>
                - Sản phẩm bị rơi vỡ, cấn móp, trầy xước nặng, vào nước hoặc
                cháy nổ.
              </p>

              <p>- Sản phẩm bị tự ý tháo lắp, sửa chữa tại nơi khác.</p>

              <p>
                - Sản phẩm mất tem bảo hành, mất số serial hoặc thông tin bảo
                hành không còn nguyên vẹn.
              </p>

              <p>
                - Lỗi phát sinh do người dùng sử dụng sai cách, dùng sai nguồn
                điện hoặc cài đặt phần mềm không phù hợp.
              </p>
            </div>
          )}
          {activeTab === "reviews" && <ProductReviews productId={Number(id)} />}
        </div>

        {/* RELATED PRODUCTS */}

        <div className="related-section">
          <div className="section-header">
            <h2>Sản phẩm tương tự</h2>

            <p>Có thể bạn sẽ thích</p>
          </div>

          <div className="slider-wrapper">
            {/* LEFT BUTTON */}

            <button
              className="slider-btn left"
              onClick={() => {
                document.querySelector(".related-slider").scrollBy({
                  left: -700,

                  behavior: "smooth",
                });
              }}
            >
              ❮
            </button>

            {/* RELATED SLIDER */}

            <div className="related-slider">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* RIGHT BUTTON */}

            <button
              className="slider-btn right"
              onClick={() => {
                document.querySelector(".related-slider").scrollBy({
                  left: 700,

                  behavior: "smooth",
                });
              }}
            >
              ❯
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN */}

      {showFullscreen && (
        <div
          className="fullscreen-image"
          onClick={() => setShowFullscreen(false)}
        >
          <img src={selectedImage} alt="" />
        </div>
      )}
    </>
  );
}
