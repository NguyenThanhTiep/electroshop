import "./ProductReviews.css";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createReview,
  deleteReview,
  getReviewsByProduct,
  getReviewSummary,
  updateReview,
} from "../services/reviewApi";

const getErrorMessage = (error) => {
  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    (typeof error.response?.data === "string" ? error.response.data : "") ||
    "Không thể xử lý đánh giá"
  );
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("vi-VN");
};

export default function ProductReviews({ productId, onSummaryChange }) {
  const [reviews, setReviews] = useState([]);

  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingCounts: {},
  });

  const [rating, setRating] = useState(5);

  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const currentUser = useMemo(() => {
    try {
      const saved = localStorage.getItem("currentUser");

      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const userId = Number(
    currentUser?.id ?? currentUser?.userId ?? currentUser?.user?.id ?? 0,
  );

  const myReview =
    reviews.find((review) => Number(review.userId) === userId) || null;

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);

      const [reviewData, summaryData] = await Promise.all([
        getReviewsByProduct(productId),
        getReviewSummary(productId),
      ]);

      setReviews(Array.isArray(reviewData) ? reviewData : []);

      const nextSummary = summaryData || {
        averageRating: 0,
        totalReviews: 0,
        ratingCounts: {},
      };

      setSummary(nextSummary);
      onSummaryChange?.(nextSummary);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [productId, onSummaryChange]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment);
    } else {
      setRating(5);
      setComment("");
    }
  }, [myReview]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userId) {
      setErrorMessage("Vui lòng đăng nhập để đánh giá");

      return;
    }

    if (!comment.trim()) {
      setErrorMessage("Vui lòng nhập nội dung bình luận");

      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const payload = {
        productId: Number(productId),

        userId,

        rating,

        comment: comment.trim(),
      };

      if (myReview) {
        await updateReview(myReview.id, payload);

        setSuccessMessage("Cập nhật đánh giá thành công");
      } else {
        await createReview(payload);

        setSuccessMessage("Gửi đánh giá thành công");
      }

      await loadReviews();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) {
      return;
    }

    const confirmed = window.confirm("Bạn có chắc muốn xóa đánh giá này?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteReview(myReview.id, userId);

      setSuccessMessage("Đã xóa đánh giá");

      setComment("");
      setRating(5);

      await loadReviews();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  return (
    <section className="product-reviews">
      <div className="review-summary">
        <div className="review-score">
          <strong>{Number(summary.averageRating || 0).toFixed(1)}</strong>

          <div className="review-summary-stars">★★★★★</div>

          <span>{summary.totalReviews || 0} đánh giá</span>
        </div>
      </div>

      <form className="review-form" onSubmit={handleSubmit}>
        <h3>
          {myReview ? "Chỉnh sửa đánh giá của bạn" : "Viết đánh giá sản phẩm"}
        </h3>

        {!userId && (
          <p className="review-login-message">
            Vui lòng đăng nhập để đánh giá.
          </p>
        )}

        <div className="review-star-input">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={star <= rating ? "review-star active" : "review-star"}
              onClick={() => setRating(star)}
              disabled={!userId}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          maxLength={2000}
          disabled={!userId}
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
          onChange={(event) => setComment(event.target.value)}
        />

        <div className="review-form-footer">
          <span>{comment.length}/2000</span>

          <div>
            {myReview && (
              <button
                type="button"
                className="review-delete-btn"
                onClick={handleDelete}
              >
                Xóa đánh giá
              </button>
            )}

            <button
              type="submit"
              className="review-submit-btn"
              disabled={!userId || saving}
            >
              {saving ? "Đang gửi..." : myReview ? "Cập nhật" : "Gửi đánh giá"}
            </button>
          </div>
        </div>

        {errorMessage && <p className="review-error">{errorMessage}</p>}

        {successMessage && <p className="review-success">{successMessage}</p>}
      </form>

      <div className="review-list">
        <h3>Đánh giá từ khách hàng</h3>

        {loading ? (
          <p>Đang tải đánh giá...</p>
        ) : reviews.length === 0 ? (
          <p>Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="review-card">
              <div className="review-card-header">
                <div>
                  <strong>{review.userName}</strong>

                  {review.verifiedPurchase && (
                    <span className="verified-review">✓ Đã mua hàng</span>
                  )}
                </div>

                <time>{formatDate(review.createdAt)}</time>
              </div>

              <div className="review-card-stars">
                {"★".repeat(review.rating)}

                <span>{"★".repeat(5 - review.rating)}</span>
              </div>

              <p>{review.comment}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
