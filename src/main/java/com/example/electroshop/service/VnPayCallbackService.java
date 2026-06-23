package com.example.electroshop.service;

import com.example.electroshop.entity.Order;
import com.example.electroshop.entity.OrderItem;
import com.example.electroshop.entity.Payment;
import com.example.electroshop.entity.Product;
import com.example.electroshop.entity.enums.OrderStatus;
import com.example.electroshop.entity.enums.PaymentStatus;
import com.example.electroshop.repository.OrderRepository;
import com.example.electroshop.repository.PaymentRepository;
import com.example.electroshop.repository.ProductRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class VnPayCallbackService {

    private final VnPayService vnPayService;

    private final PaymentRepository
            paymentRepository;

    private final OrderRepository
            orderRepository;

    private final ProductRepository
            productRepository;

private final OrderBenefitService
        orderBenefitService;

    public VnPayCallbackService(
        VnPayService vnPayService,
        PaymentRepository paymentRepository,
        OrderRepository orderRepository,
        ProductRepository productRepository,
        OrderBenefitService orderBenefitService
) {
        this.vnPayService =
                vnPayService;

        this.paymentRepository =
                paymentRepository;

        this.orderRepository =
                orderRepository;

        this.productRepository =
                productRepository;
        
        this.orderBenefitService =
        orderBenefitService;
    }

    @Transactional
    public Map<String, String> processIpn(
            Map<String, String> params
    ) {
        /*
         * 1. Kiểm tra chữ ký.
         */
        if (!vnPayService.verifySignature(params)) {
            return ipnResponse(
                    "97",
                    "Invalid signature"
            );
        }

        String txnRef =
                params.get("vnp_TxnRef");

        /*
         * 2. Tìm giao dịch trong database.
         */
        Payment payment =
                paymentRepository
                        .findByTxnRef(txnRef)
                        .orElse(null);

        if (payment == null) {
            return ipnResponse(
                    "01",
                    "Order not found"
            );
        }

        /*
         * 3. Kiểm tra số tiền.
         */
        long receivedAmount;

        try {
            receivedAmount =
                    Long.parseLong(
                            params.get("vnp_Amount")
                    );
        } catch (
            NumberFormatException exception
        ) {
            return ipnResponse(
                    "04",
                    "Invalid amount"
            );
        }

        long expectedAmount =
                payment.getAmount()
                        .multiply(
                                BigDecimal.valueOf(100)
                        )
                        .setScale(
                                0,
                                RoundingMode.UNNECESSARY
                        )
                        .longValueExact();

        if (receivedAmount != expectedAmount) {
            return ipnResponse(
                    "04",
                    "Invalid amount"
            );
        }


        String responseCode =
                params.get("vnp_ResponseCode");

        String transactionStatus =
                params.get(
                        "vnp_TransactionStatus"
                );

        payment.setVnpTransactionNo(
                params.get(
                        "vnp_TransactionNo"
                )
        );

        payment.setVnpResponseCode(
                responseCode
        );

        payment.setVnpTransactionStatus(
                transactionStatus
        );

        payment.setBankCode(
                params.get("vnp_BankCode")
        );

        payment.setCardType(
                params.get("vnp_CardType")
        );

        payment.setPayDate(
                params.get("vnp_PayDate")
        );

        Order order =
                payment.getOrder();

        boolean paymentSuccess =
                "00".equals(responseCode) &&
                "00".equals(transactionStatus);

        if (paymentSuccess) {

    if (
            payment.getStatus()
                    != PaymentStatus.PAID
    ) {
        payment.setStatus(
                PaymentStatus.PAID
        );

        order.setPaymentStatus(
                PaymentStatus.PAID
        );

        /*
         * Đã thanh toán nhưng vẫn cần
         * cửa hàng xác nhận đơn.
         */
        order.setOrderStatus(
                OrderStatus.PENDING_CONFIRMATION
        );

        order.setExpiresAt(null);

        paymentRepository.save(
                payment
        );

        orderRepository.save(
                order
        );
    }

    /*
     * Gọi cả khi Payment đã PAID.
     * benefitsCommitted sẽ chống tăng lặp.
     */
    orderBenefitService
            .commitBenefits(
                    order.getId()
            );

    return ipnResponse(
            "00",
            "Confirm Success"
    );

} else {

    if (
            payment.getStatus()
                    == PaymentStatus.UNPAID ||
            payment.getStatus()
                    == PaymentStatus.PROCESSING
    ) {
        payment.setStatus(
                PaymentStatus.FAILED
        );

        payment.setFailureReason(
                "VNPAY response code: "
                        + responseCode
        );

        order.setPaymentStatus(
                PaymentStatus.FAILED
        );

        order.setOrderStatus(
                OrderStatus.CANCELLED
        );

        /*
         * Thanh toán thất bại:
         * hoàn lại tồn kho đã giữ.
         */
        releaseStock(order);

        paymentRepository.save(
                payment
        );

        orderRepository.save(
                order
        );
    }

    return ipnResponse(
            "00",
            "Confirm Success"
    );
}

    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentStatus(
            String txnRef
    ) {
        Payment payment =
                paymentRepository
                        .findByTxnRef(txnRef)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy giao dịch"
                                )
                        );

        Order order =
                payment.getOrder();

        Map<String, Object> result =
                new LinkedHashMap<>();

        result.put(
                "txnRef",
                payment.getTxnRef()
        );

        result.put(
                "orderId",
                order.getId()
        );

        result.put(
                "orderCode",
                order.getOrderCode()
        );

        result.put(
                "amount",
                payment.getAmount()
        );

        result.put(
                "paymentStatus",
                payment.getStatus()
        );

        result.put(
                "orderStatus",
                order.getOrderStatus()
        );

        result.put(
                "vnpResponseCode",
                payment.getVnpResponseCode()
        );

        result.put(
                "vnpTransactionNo",
                payment.getVnpTransactionNo()
        );

        return result;
    }

    private void releaseStock(
            Order order
    ) {
        if (
            Boolean.TRUE.equals(
                    order.getStockReleased()
            )
        ) {
            return;
        }

        for (
            OrderItem item
            : order.getItems()
        ) {
            Product product =
                    productRepository
                            .findByIdForUpdate(
                                    item.getProductId()
                            )
                            .orElse(null);

            if (product == null) {
                continue;
            }

            int currentStock =
                    product.getStock() == null
                            ? 0
                            : product.getStock();

            int quantity =
                    item.getQuantity() == null
                            ? 0
                            : item.getQuantity();

            product.setStock(
                    currentStock + quantity
            );

            productRepository.save(product);
        }

        order.setStockReleased(true);
    }

    private Map<String, String> ipnResponse(
            String rspCode,
            String message
    ) {
        Map<String, String> result =
                new LinkedHashMap<>();

        result.put("RspCode", rspCode);

        result.put("Message", message);

        return result;
    }
}