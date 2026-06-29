import "./PaymentResultPage.css";

import { useEffect, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import {
  clearCart,
  clearBuyNowItem,
  clearSelectedCartItems,
} from "../utils/cartUtils";

import { getVnpayPaymentStatus } from "../services/paymentApi";

const formatPrice = (value) => {
  return Number(value || 0).toLocaleString("vi-VN");
};

export default function PaymentResultPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const txnRef =
    searchParams.get("txnRef") || sessionStorage.getItem("pendingVnpayTxnRef");

  const responseCode = searchParams.get("responseCode");

  const validSignature = searchParams.get("validSignature");

  const [payment, setPayment] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!txnRef) {
      setError("Không tìm thấy mã giao dịch VNPAY");

      setLoading(false);

      return;
    }

    let stopped = false;
    let timer;
    let count = 0;

    const checkPayment = async () => {
      try {
        const data = await getVnpayPaymentStatus(txnRef);

        if (stopped) {
          return;
        }

        setPayment(data);

        if (data.paymentStatus === "PAID") {
          const pendingCheckoutSource =
            sessionStorage.getItem("pendingCheckoutSource") ||
            sessionStorage.getItem("checkoutSource") ||
            "CART";

          if (pendingCheckoutSource === "BUY_NOW") {
            clearBuyNowItem();
          } else {
            const selectedCartKeys = JSON.parse(
              sessionStorage.getItem("pendingSelectedCartKeys") || "[]",
            );

            if (
              Array.isArray(selectedCartKeys) &&
              selectedCartKeys.length > 0
            ) {
              clearSelectedCartItems(selectedCartKeys);
            } else {
              clearCart();
            }
          }

          sessionStorage.removeItem("pendingVnpayTxnRef");
          sessionStorage.removeItem("pendingOrderCode");
          sessionStorage.removeItem("pendingCheckoutSource");
          sessionStorage.removeItem("selectedCheckoutCartKeys");
          sessionStorage.removeItem("pendingSelectedCartKeys");

          setLoading(false);
          return;
        }

        if (
          data.paymentStatus === "FAILED" ||
          data.paymentStatus === "REFUNDED"
        ) {
          setLoading(false);

          return;
        }

        count += 1;

        if (count >= 8) {
          setLoading(false);

          return;
        }

        timer = setTimeout(checkPayment, 2000);
      } catch (requestError) {
        console.error(requestError);

        count += 1;

        if (count >= 5) {
          setError(
            requestError.response?.data?.message ||
              "Không thể kiểm tra trạng thái thanh toán",
          );

          setLoading(false);

          return;
        }

        timer = setTimeout(checkPayment, 2000);
      }
    };

    checkPayment();

    return () => {
      stopped = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [txnRef]);

  const isPaid = payment?.paymentStatus === "PAID";

  const isFailed = payment?.paymentStatus === "FAILED";

  return (
    <>
      <Header />

      <main className="payment-result-page">
        <section className="payment-result-card">
          {loading && (
            <>
              <div className="payment-result-icon pending">⏳</div>

              <h1>Đang xác nhận thanh toán</h1>

              <p>Hệ thống đang kiểm tra kết quả giao dịch từ VNPAY.</p>
            </>
          )}

          {!loading && isPaid && (
            <>
              <div className="payment-result-icon success">✓</div>

              <h1>Thanh toán thành công</h1>

              <p>Đơn hàng đã được ghi nhận và đang chờ cửa hàng xác nhận.</p>
            </>
          )}

          {!loading && isFailed && (
            <>
              <div className="payment-result-icon failed">✕</div>

              <h1>Thanh toán thất bại</h1>

              <p>Giao dịch chưa được hoàn tất.</p>
            </>
          )}

          {!loading && !isPaid && !isFailed && !error && (
            <>
              <div className="payment-result-icon pending">!</div>

              <h1>Giao dịch đang được xử lý</h1>

              <p>Hãy kiểm tra lại trong lịch sử đơn hàng.</p>
            </>
          )}

          {error && <div className="payment-result-error">{error}</div>}

          <div className="payment-result-info">
            <div>
              <span>Mã giao dịch</span>

              <strong>{payment?.txnRef || txnRef || "---"}</strong>
            </div>

            <div>
              <span>Mã đơn hàng</span>

              <strong>{payment?.orderCode || "---"}</strong>
            </div>

            <div>
              <span>Số tiền</span>

              <strong>
                {payment?.amount ? `${formatPrice(payment.amount)}đ` : "---"}
              </strong>
            </div>

            <div>
              <span>Trạng thái</span>

              <strong>{payment?.paymentStatus || "ĐANG KIỂM TRA"}</strong>
            </div>

            <div>
              <span>Mã phản hồi VNPAY</span>

              <strong>
                {payment?.vnpResponseCode || responseCode || "---"}
              </strong>
            </div>

            <div>
              <span>Chữ ký hợp lệ</span>

              <strong>
                {validSignature === "true"
                  ? "Có"
                  : validSignature === "false"
                    ? "Không"
                    : "Đang kiểm tra"}
              </strong>
            </div>
          </div>

          <div className="payment-result-actions">
            <button type="button" onClick={() => navigate("/orders")}>
              Xem đơn hàng
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => navigate("/")}
            >
              Về trang chủ
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
