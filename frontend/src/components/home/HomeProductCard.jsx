import "./HomeProductCard.css";

import { getImageUrl } from "../../utils/imageUtils";

const FALLBACK_IMAGE =
  "https://placehold.co/500x360/eef2ff/1e293b?text=ElectroShop";

const formatCurrency = (value) => {
  const numberValue = Number(value || 0);

  if (numberValue <= 0) {
    return "Đang cập nhật";
  }

  const roundedValue = Math.round(numberValue / 1000) * 1000;

  return `${roundedValue.toLocaleString("vi-VN")}đ`;
};

const getDiscountLabel = (priceInfo) => {
  if (!priceInfo || priceInfo.priceSource === "REGULAR") {
    return "";
  }

  const percent = Number(priceInfo.discountPercent || 0);

  if (priceInfo.priceSource === "FLASH_SALE") {
    return percent > 0 ? `Flash Sale -${percent}%` : "Flash Sale";
  }

  if (priceInfo.priceSource === "PROMOTION") {
    return percent > 0 ? `Giảm ${percent}%` : "Đang giảm giá";
  }

  return "";
};

const formatRating = (value) => {
  const rating = Number(value || 0);

  if (rating <= 0) {
    return "";
  }

  return rating.toFixed(1).replace(".0", "");
};

export default function HomeProductCard({ product, priceInfo, onOpen }) {
  const finalPrice = Number(priceInfo?.finalPrice ?? product?.price ?? 0);

  const originalPrice = Number(priceInfo?.originalPrice ?? product?.price ?? 0);

  const isDiscounted = finalPrice > 0 && originalPrice > finalPrice;

  const discountLabel = getDiscountLabel(priceInfo);

  const priceSource = priceInfo?.priceSource || "REGULAR";

  const isFlashSale = priceSource === "FLASH_SALE";

  const isPromotion = priceSource === "PROMOTION";

  const soldQuantity = Number(product?.soldQuantity || product?.sold || 0);

  const averageRating = Number(product?.averageRating || 0);

  const totalReviews = Number(product?.totalReviews || 0);

  const hasRating = totalReviews > 0 && averageRating > 0;

  const ratingText = formatRating(averageRating);

  return (
    <article
      className={`eshop-product-card ${
        isFlashSale ? "is-flash-sale" : isPromotion ? "is-promotion" : ""
      }`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onOpen?.();
        }
      }}
    >
      {discountLabel && (
        <div className="eshop-card-badges">
          <span className="eshop-card-badge eshop-card-badge-sale">
            {discountLabel}
          </span>
        </div>
      )}

      <div className="eshop-card-image-wrap">
        <img
          src={getImageUrl(product?.image)}
          alt={product?.name || "Sản phẩm"}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
      </div>

      <div className="eshop-card-body">
        <h3>{product?.name || "Sản phẩm chưa có tên"}</h3>

        <div className="eshop-card-price-row">
          <strong>{formatCurrency(finalPrice)}</strong>

          {isDiscounted && <del>{formatCurrency(originalPrice)}</del>}
        </div>

        <div className="eshop-card-meta">
          <span className="eshop-card-sold">
            Đã bán <b>{soldQuantity}</b>
          </span>

          <span className="eshop-card-rating">
            {hasRating ? (
              <>
                ⭐ <b>{ratingText}</b>
              </>
            ) : (
              <>
                ⭐ <b>Chưa có</b>
              </>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}
