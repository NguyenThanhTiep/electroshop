package com.example.electroshop.service;

import com.example.electroshop.dto.CouponApplyResponse;
import com.example.electroshop.dto.checkout.CheckoutItemRequest;
import com.example.electroshop.dto.checkout.CheckoutRequest;
import com.example.electroshop.dto.checkout.CheckoutResponse;
import com.example.electroshop.entity.Order;
import com.example.electroshop.entity.OrderItem;
import com.example.electroshop.entity.Payment;
import com.example.electroshop.entity.Product;
import com.example.electroshop.entity.Promotion;
import com.example.electroshop.entity.User;
import com.example.electroshop.entity.enums.OrderStatus;
import com.example.electroshop.entity.enums.PaymentMethod;
import com.example.electroshop.entity.enums.PaymentStatus;
import com.example.electroshop.repository.OrderRepository;
import com.example.electroshop.repository.PaymentRepository;
import com.example.electroshop.repository.ProductRepository;
import com.example.electroshop.repository.PromotionRepository;
import com.example.electroshop.repository.UserRepository;
import com.example.electroshop.entity.FlashSale;
import com.example.electroshop.entity.FlashSaleItem;
import com.example.electroshop.repository.FlashSaleItemRepository;
import com.example.electroshop.repository.FlashSaleRepository;

import jakarta.transaction.Transactional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class CheckoutService {

    private static final BigDecimal FREE_SHIPPING_THRESHOLD =
            new BigDecimal("20000000");

    private static final BigDecimal DEFAULT_SHIPPING_FEE =
            new BigDecimal("30000");

    private final ProductRepository productRepository;

    private final OrderRepository orderRepository;

    private final PaymentRepository paymentRepository;

    private final UserRepository userRepository;

    private final VnPayService vnPayService;

    private final CouponService couponService;

    private final FlashSaleRepository flashSaleRepository;

    private final FlashSaleItemRepository flashSaleItemRepository;

    private final PromotionRepository promotionRepository;

    private final OrderBenefitService orderBenefitService;

    public CheckoutService(
        ProductRepository productRepository,
        OrderRepository orderRepository,
        PaymentRepository paymentRepository,
        UserRepository userRepository,
        VnPayService vnPayService,
        CouponService couponService,
        FlashSaleRepository flashSaleRepository,
        FlashSaleItemRepository flashSaleItemRepository,
        PromotionRepository promotionRepository,
        OrderBenefitService orderBenefitService
) {
        this.productRepository =
                productRepository;

        this.orderRepository =
                orderRepository;

        this.paymentRepository =
                paymentRepository;

        this.userRepository =
                userRepository;

        this.vnPayService =
                vnPayService;

        this.couponService =
                couponService;

        this.flashSaleRepository =
                flashSaleRepository;

        this.flashSaleItemRepository =
                flashSaleItemRepository;

        this.promotionRepository =
                promotionRepository;

        this.orderBenefitService =
                orderBenefitService;
    }

    @Transactional
    public CheckoutResponse checkout(
            CheckoutRequest request,
            String clientIp
    ) {
        validateRequest(request);

        User user =
                userRepository
                        .findById(request.getUserId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Tài khoản không tồn tại"
                                )
                        );

        Order order =
                new Order();

        order.setOrderCode(
                generateOrderCode()
        );

        order.setUserId(
                user.getId()
        );

        order.setCustomerName(
                request.getCustomerName().trim()
        );

        order.setEmail(
                request.getEmail() == null
                        ? user.getEmail()
                        : request.getEmail().trim()
        );

        order.setPhone(
                request.getPhone().trim()
        );

        order.setShippingAddress(
                request.getShippingAddress().trim()
        );

        order.setNote(
                request.getNote()
        );

        order.setPaymentMethod(
                request.getPaymentMethod()
        );

        order.setBenefitsCommitted(
        false
);

order.setBenefitsReleased(
        false
);

        /*
         * Sắp xếp ID trước khi khóa để giảm nguy cơ deadlock
         * khi nhiều đơn có cùng sản phẩm.
         */
        List<CheckoutItemRequest> sortedItems =
                request.getItems()
                        .stream()
                        .sorted(
                                Comparator.comparing(
                                        CheckoutItemRequest::getProductId
                                )
                        )
                        .toList();

        BigDecimal subtotal =
                BigDecimal.ZERO;

        for (CheckoutItemRequest requestedItem
                : sortedItems) {

            Product product =
                    productRepository
                            .findByIdForUpdate(
                                    requestedItem.getProductId()
                            )
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.NOT_FOUND,
                                            "Không tìm thấy sản phẩm ID: "
                                                    + requestedItem.getProductId()
                                    )
                            );

            Integer quantity =
                    requestedItem.getQuantity();

            if (
                    product.getStock() == null ||
                    product.getStock() < quantity
            ) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Sản phẩm \""
                                + product.getName()
                                + "\" chỉ còn "
                                + (
                                product.getStock() == null
                                        ? 0
                                        : product.getStock()
                        )
                                + " sản phẩm"
                );
            }

            if (
                    product.getPrice() == null ||
                    product.getPrice()
                            .compareTo(BigDecimal.ZERO) < 0
            ) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Sản phẩm \""
                                + product.getName()
                                + "\" có giá không hợp lệ"
                );
            }

            /*
             * Hiện tại lấy giá gốc của Product.
             * Giá tùy chọn sẽ bổ sung sau khi biết
             * chính xác JSON trong product.options.
             */
            BigDecimal unitPrice =
        resolveCheckoutUnitPrice(
                product,
                quantity
        );

FlashSaleItem appliedFlashSaleItem =
        findAppliedFlashSaleItem(
                product,
                quantity,
                unitPrice
        );

String priceSource;

if (appliedFlashSaleItem != null) {
    priceSource =
            "FLASH_SALE";

} else if (
        unitPrice.compareTo(
                product.getPrice()
        ) < 0
) {
    priceSource =
            "PROMOTION";

} else {
    priceSource =
            "REGULAR";
}

BigDecimal lineTotal =
        unitPrice.multiply(
                BigDecimal.valueOf(quantity)
        );

            OrderItem orderItem =
                    new OrderItem();

            orderItem.setProductId(
                    product.getId()
            );

            orderItem.setProductName(
                    product.getName()
            );

            orderItem.setProductImage(
                    product.getImage()
            );

            orderItem.setSelectedOptions(
                    requestedItem.getSelectedOptions()
            );

            orderItem.setUnitPrice(
                    unitPrice
            );

            orderItem.setQuantity(
                    quantity
            );

            orderItem.setLineTotal(
        lineTotal
);

orderItem.setFlashSaleItemId(
        appliedFlashSaleItem == null
                ? null
                : appliedFlashSaleItem
                        .getId()
);

orderItem.setPriceSource(
        priceSource
);

order.addItem(orderItem);

            subtotal =
                    subtotal.add(
                            lineTotal
                    );

            /*
             * Giữ hàng ngay khi tạo đơn.
             * Nếu VNPAY thất bại hoặc hết hạn,
             * hệ thống sẽ hoàn lại ở bước sau.
             */
            product.setStock(
                    product.getStock() - quantity
            );

            productRepository.save(product);
        }

        BigDecimal shippingFee =
                calculateShippingFee(subtotal);

        BigDecimal discountAmount =
                BigDecimal.ZERO;

        String couponCode =
                request.getCouponCode() == null
                        ? ""
                        : request
                                .getCouponCode()
                                .trim();

        if (!couponCode.isEmpty()) {

    CouponApplyResponse couponResult =
            couponService
                    .calculateCoupon(
                            couponCode,
                            subtotal
                    );

    if (
            couponResult.getValid() == null ||
            !couponResult.getValid()
    ) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                couponResult.getMessage()
        );
    }

    discountAmount =
            BigDecimal.valueOf(
                            couponResult
                                    .getDiscountAmount()
                    )
                    .setScale(
                            2,
                            RoundingMode.HALF_UP
                    );
}

order.setCouponCode(
        couponCode.isEmpty()
                ? null
                : couponCode.toUpperCase()
);

BigDecimal totalAmount =
        subtotal
                        .add(shippingFee)
                        .subtract(discountAmount)
                        .max(BigDecimal.ZERO)
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        order.setSubtotal(subtotal);

        order.setShippingFee(
                shippingFee
        );

        order.setDiscountAmount(
                discountAmount
        );

        order.setTotalAmount(
                totalAmount
        );

        order.setPaymentStatus(
                PaymentStatus.UNPAID
        );

        if (
                request.getPaymentMethod()
                        == PaymentMethod.VNPAY
        ) {
            order.setOrderStatus(
                    OrderStatus.WAITING_PAYMENT
            );

            order.setExpiresAt(
                    LocalDateTime.now()
                            .plusMinutes(15)
            );

        } else {

            order.setOrderStatus(
                    OrderStatus.PENDING_CONFIRMATION
            );

            order.setExpiresAt(null);
        }

        Order savedOrder =
        orderRepository.save(order);

/*
 * COD không có callback thanh toán.
 * Đơn được xem là hợp lệ sau khi tạo thành công.
 */
if (
        request.getPaymentMethod()
                != PaymentMethod.VNPAY
) {
    orderBenefitService
            .commitBenefits(
                    savedOrder.getId()
            );
}

/*
 * Với VNPAY, mỗi lần thanh toán
 * phải có một Payment riêng.
 */
String paymentUrl =
        null;

        if (
                request.getPaymentMethod()
                        == PaymentMethod.VNPAY
        ) {
            Payment payment =
                    new Payment();

            payment.setOrder(savedOrder);

            payment.setTxnRef(
                    generateTxnRef(
                            savedOrder.getOrderCode()
                    )
            );

            payment.setAmount(
                    savedOrder.getTotalAmount()
            );

            payment.setStatus(
                    PaymentStatus.UNPAID
            );

            Payment savedPayment =
                    paymentRepository.save(payment);

            paymentUrl =
                    vnPayService.createPaymentUrl(
                            savedPayment,
                            clientIp
                    );
        }

        return new CheckoutResponse(
                savedOrder.getId(),
                savedOrder.getOrderCode(),
                savedOrder.getSubtotal(),
                savedOrder.getShippingFee(),
                savedOrder.getDiscountAmount(),
                savedOrder.getTotalAmount(),
                savedOrder.getPaymentMethod(),
                savedOrder.getPaymentStatus(),
                savedOrder.getOrderStatus(),
                paymentUrl
        );
    }

    private void validateRequest(
            CheckoutRequest request
    ) {
        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dữ liệu thanh toán không hợp lệ"
            );
        }

        if (request.getUserId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chưa xác định người đặt hàng"
            );
        }

        if (isBlank(request.getCustomerName())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng nhập họ tên người nhận"
            );
        }

        if (isBlank(request.getPhone())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng nhập số điện thoại"
            );
        }

        if (isBlank(request.getShippingAddress())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng nhập địa chỉ nhận hàng"
            );
        }

        if (request.getPaymentMethod() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng chọn phương thức thanh toán"
            );
        }

        if (
                request.getItems() == null ||
                request.getItems().isEmpty()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Giỏ hàng đang trống"
            );
        }

        for (CheckoutItemRequest item
                : request.getItems()) {

            if (item.getProductId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Sản phẩm không có ID"
                );
            }

            if (
                    item.getQuantity() == null ||
                    item.getQuantity() <= 0
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Số lượng sản phẩm phải lớn hơn 0"
                );
            }
        }
    }

    private BigDecimal resolveCheckoutUnitPrice(
            Product product,
            Integer requestedQuantity
    ) {
        BigDecimal originalPrice =
                product.getPrice();

        int quantity =
                requestedQuantity == null
                        ? 1
                        : requestedQuantity;

        LocalDateTime now =
                LocalDateTime.now();

        /*
         * Ưu tiên 1: Flash Sale
         */
        FlashSale flashSale =
                flashSaleRepository
                        .findFirstByActiveTrueAndStartTimeLessThanEqualAndEndTimeGreaterThanEqualOrderBySortOrderAsc(
                                now,
                                now
                        )
                        .orElse(null);

        if (flashSale != null) {
            FlashSaleItem flashSaleItem =
                    flashSaleItemRepository
                            .findFirstByFlashSaleIdAndProductIdAndActiveTrueOrderByIdDesc(
                                    flashSale.getId(),
                                    product.getId()
                            )
                            .orElse(null);

            if (flashSaleItem != null) {
                BigDecimal salePrice =
                        flashSaleItem
                                .getSalePrice();

                boolean validSalePrice =
                        salePrice != null &&
                        salePrice.compareTo(
                                BigDecimal.ZERO
                        ) > 0 &&
                        salePrice.compareTo(
                                originalPrice
                        ) < 0;

                if (validSalePrice) {
                    int saleQuantity =
                            flashSaleItem
                                    .getSaleQuantity() == null
                                    ? 0
                                    : flashSaleItem
                                            .getSaleQuantity();

                    int soldQuantity =
                            flashSaleItem
                                    .getSoldQuantity() == null
                                    ? 0
                                    : flashSaleItem
                                            .getSoldQuantity();

                    int remainingQuantity =
                            Math.max(
                                    0,
                                    saleQuantity -
                                    soldQuantity
                            );

                    if (
                            remainingQuantity <
                            quantity
                    ) {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Sản phẩm \""
                                        + product.getName()
                                        + "\" chỉ còn "
                                        + remainingQuantity
                                        + " suất Flash Sale"
                        );
                    }

                    Integer limitPerUser =
                            flashSaleItem
                                    .getLimitPerUser();

                    if (
                            limitPerUser != null &&
                            limitPerUser > 0 &&
                            quantity >
                            limitPerUser
                    ) {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Mỗi khách hàng chỉ được mua tối đa "
                                        + limitPerUser
                                        + " sản phẩm Flash Sale"
                        );
                    }

                    return salePrice;
                }
            }
        }

        /*
         * Ưu tiên 2: Promotion
         */
        Promotion promotion =
                promotionRepository
                        .findActivePromotionsForProduct(
                                product.getId(),
                                LocalDate.now()
                        )
                        .stream()
                        .findFirst()
                        .orElse(null);

        if (
                promotion != null &&
                promotion
                        .getDiscountPercent() != null &&
                promotion
                        .getDiscountPercent() > 0 &&
                promotion
                        .getDiscountPercent() < 100
        ) {
            BigDecimal discountPercent =
                    BigDecimal.valueOf(
                            promotion
                                    .getDiscountPercent()
                    );

            return originalPrice
                    .multiply(
                            BigDecimal
                                    .valueOf(100)
                                    .subtract(
                                            discountPercent
                                    )
                    )
                    .divide(
                            BigDecimal
                                    .valueOf(100),
                            2,
                            RoundingMode.HALF_UP
                    );
        }

            /*
     * Giá gốc
     */
    return originalPrice;
}

private FlashSaleItem findAppliedFlashSaleItem(
        Product product,
        Integer requestedQuantity,
        BigDecimal unitPrice
) {
    LocalDateTime now =
            LocalDateTime.now();

    FlashSale flashSale =
            flashSaleRepository
                    .findFirstByActiveTrueAndStartTimeLessThanEqualAndEndTimeGreaterThanEqualOrderBySortOrderAsc(
                            now,
                            now
                    )
                    .orElse(null);

    if (flashSale == null) {
        return null;
    }

    FlashSaleItem item =
            flashSaleItemRepository
                    .findFirstByFlashSaleIdAndProductIdAndActiveTrueOrderByIdDesc(
                            flashSale.getId(),
                            product.getId()
                    )
                    .orElse(null);

    if (
            item == null ||
            item.getSalePrice() == null
    ) {
        return null;
    }

    /*
     * Chỉ đánh dấu Flash Sale nếu đơn giá
     * thật sự bằng salePrice.
     *
     * Điều này tránh nhầm với Promotion.
     */
    if (
            unitPrice.compareTo(
                    item.getSalePrice()
            ) != 0
    ) {
        return null;
    }

    return item;
}

private BigDecimal calculateShippingFee(
        BigDecimal subtotal
) {
        if (
                subtotal.compareTo(
                        FREE_SHIPPING_THRESHOLD
                ) >= 0
        ) {
            return BigDecimal.ZERO;
        }

        return DEFAULT_SHIPPING_FEE;
    }

    private String generateOrderCode() {
        String timePart =
                LocalDateTime.now().format(
                        DateTimeFormatter.ofPattern(
                                "yyyyMMddHHmmss"
                        )
                );

        String randomPart =
                UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 6)
                        .toUpperCase();

        String orderCode =
                "ES" + timePart + randomPart;

        while (
                orderRepository.existsByOrderCode(
                        orderCode
                )
        ) {
            randomPart =
                    UUID.randomUUID()
                            .toString()
                            .replace("-", "")
                            .substring(0, 6)
                            .toUpperCase();

            orderCode =
                    "ES"
                            + timePart
                            + randomPart;
        }

        return orderCode;
    }

    private String generateTxnRef(
            String orderCode
    ) {
        return orderCode
                .replaceAll(
                        "[^a-zA-Z0-9]",
                        ""
                )
                + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 8)
                        .toUpperCase();
    }

    private boolean isBlank(
            String value
    ) {
        return value == null ||
                value.trim().isEmpty();
    }
}