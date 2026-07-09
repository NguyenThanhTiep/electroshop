import { Link } from "react-router-dom";

import { getImageUrl } from "../utils/imageUtils";

import { addToCart } from "../utils/cartUtils";

import { useToast } from "./common/ToastProvider";

export default function ProductCard({ product }) {
  const toast = useToast();
  const averageRating = Number(product?.averageRating || 0);
  const totalReviews = Number(product?.totalReviews || 0);
  const hasRating = totalReviews > 0 && averageRating > 0;
  const ratingText = averageRating.toFixed(1).replace(".0", "");

  return (
    <Link to={`/product/${product.id}`} className="product-link">
      <div className="product-card">
        <img src={getImageUrl(product.image)} alt={product.name} />

        <button
          className="add-cart-btn"
          onClick={(e) => {
            e.preventDefault();

            addToCart(product);

            toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
          }}
        >
          +
        </button>

        <div className="product-info">
          <h3>{product.name}</h3>

          <div className="rating">
            {hasRating ? `⭐ ${ratingText} (${totalReviews})` : "⭐ Chưa có"}
          </div>

          <p className="price">
            {Number(product.price).toLocaleString("vi-VN")}đ
          </p>
        </div>
      </div>
    </Link>
  );
}
