package com.example.electroshop.service;

import com.example.electroshop.dto.CouponApplyResponse;
import com.example.electroshop.dto.checkout.CheckoutItemRequest;
import com.example.electroshop.dto.checkout.CheckoutRequest;
import com.example.electroshop.dto.checkout.CheckoutResponse;
import com.example.electroshop.entity.FlashSale;
import com.example.electroshop.entity.FlashSaleItem;
import com.example.electroshop.entity.Order;
import com.example.electroshop.entity.OrderItem;
import com.example.electroshop.entity.Payment;
import com.example.electroshop.entity.Product;
import com.example.electroshop.entity.Promotion;
import com.example.electroshop.entity.User;
import com.example.electroshop.entity.enums.OrderStatus;
import com.example.electroshop.entity.enums.PaymentMethod;
import com.example.electroshop.entity.enums.PaymentStatus;
import com.example.electroshop.repository.FlashSaleItemRepository;
import com.example.electroshop.repository.FlashSaleRepository;
import com.example.electroshop.repository.OrderRepository;
import com.example.electroshop.repository.PaymentRepository;
import com.example.electroshop.repository.ProductRepository;
import com.example.electroshop.repository.PromotionRepository;
import com.example.electroshop.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

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
import java.util.Map;
import java.util.UUID;

@Service
public class CheckoutService {

    private static final BigDecimal FREE_SHIPPING_THRESHOLD =
            new BigDecimal("20000000");

    private static final BigDecimal DEFAULT_SHIPPING_FEE =
            new BigDecimal("30000");

    private final ObjectMapper objectMapper =
            new ObjectMapper();

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
            String authenticatedEmail,
            String clientIp
    ) {
        validateRequest(request);

        User user =
                userRepository
                        .findByEmail(authenticatedEmail)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Tài khoản JWT không tồn tại"
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

        order.setBenefitsCommitted(false);

        order.setBenefitsReleased(false);

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

        for (CheckoutItemRequest requestedItem : sortedItems) {
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
                    product.getPrice().compareTo(BigDecimal.ZERO) < 0
            ) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Sản phẩm \""
                                + product.getName()
                                + "\" có giá không hợp lệ"
                );
            }

            ResolvedCheckoutPrice resolvedPrice =
                    resolveCheckoutPrice(
                            product,
                            requestedItem.getSelectedOptions(),
                            quantity
                    );

            BigDecimal unitPrice =
                    resolvedPrice.getUnitPrice();

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
                    resolvedPrice.getFlashSaleItem() == null
                            ? null
                            : resolvedPrice
                                    .getFlashSaleItem()
                                    .getId()
            );

            orderItem.setPriceSource(
                    resolvedPrice.getPriceSource()
            );

            order.addItem(orderItem);

            subtotal =
                    subtotal.add(lineTotal);

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

        order.setSubtotal(
                subtotal
        );

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

        if (
                request.getPaymentMethod()
                        != PaymentMethod.VNPAY
        ) {
            orderBenefitService
                    .commitBenefits(
                            savedOrder.getId()
                    );
        }

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

        for (CheckoutItemRequest item : request.getItems()) {
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

    private ResolvedCheckoutPrice resolveCheckoutPrice(
            Product product,
            String selectedOptionsJson,
            Integer requestedQuantity
    ) {
        BigDecimal regularPrice =
                resolveRegularPriceWithOptions(
                        product,
                        selectedOptionsJson
                );

        int quantity =
                requestedQuantity == null
                        ? 1
                        : requestedQuantity;

        FlashSaleItem flashSaleItem =
                findValidActiveFlashSaleItem(
                        product,
                        quantity
                );

        if (flashSaleItem != null) {
            Integer discountPercent =
                    flashSaleItem.getDiscountPercent();

            if (
                    discountPercent != null &&
                    discountPercent > 0 &&
                    discountPercent < 100
            ) {
                BigDecimal flashSalePrice =
                        regularPrice
                                .multiply(
                                        BigDecimal.valueOf(
                                                100 - discountPercent
                                        )
                                )
                                .divide(
                                        BigDecimal.valueOf(100),
                                        2,
                                        RoundingMode.HALF_UP
                                );

                return new ResolvedCheckoutPrice(
                        flashSalePrice,
                        "FLASH_SALE",
                        flashSaleItem
                );
            }

            BigDecimal salePrice =
                    flashSaleItem.getSalePrice();

            if (
                    salePrice != null &&
                    salePrice.compareTo(BigDecimal.ZERO) > 0 &&
                    salePrice.compareTo(regularPrice) < 0
            ) {
                return new ResolvedCheckoutPrice(
                        salePrice,
                        "FLASH_SALE",
                        flashSaleItem
                );
            }
        }

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
                promotion.getDiscountPercent() != null &&
                promotion.getDiscountPercent() > 0 &&
                promotion.getDiscountPercent() < 100
        ) {
            BigDecimal discountPercent =
                    BigDecimal.valueOf(
                            promotion.getDiscountPercent()
                    );

            BigDecimal promotionPrice =
                    regularPrice
                            .multiply(
                                    BigDecimal.valueOf(100)
                                            .subtract(discountPercent)
                            )
                            .divide(
                                    BigDecimal.valueOf(100),
                                    2,
                                    RoundingMode.HALF_UP
                            );

            return new ResolvedCheckoutPrice(
                    promotionPrice,
                    "PROMOTION",
                    null
            );
        }

        return new ResolvedCheckoutPrice(
                regularPrice,
                "REGULAR",
                null
        );
    }

    private FlashSaleItem findValidActiveFlashSaleItem(
            Product product,
            Integer requestedQuantity
    ) {
        LocalDateTime now =
                LocalDateTime.now();

        int quantity =
                requestedQuantity == null
                        ? 1
                        : requestedQuantity;

        List<FlashSale> flashSales =
                flashSaleRepository
                        .findActiveFlashSalesForHomePage(now);

        for (FlashSale flashSale : flashSales) {
            FlashSaleItem item =
                    flashSaleItemRepository
                            .findFirstByFlashSaleIdAndProductIdAndActiveTrueOrderByIdDesc(
                                    flashSale.getId(),
                                    product.getId()
                            )
                            .orElse(null);

            if (item == null) {
                continue;
            }

            boolean hasValidPercent =
                    item.getDiscountPercent() != null &&
                    item.getDiscountPercent() > 0 &&
                    item.getDiscountPercent() < 100;

            boolean hasValidSalePrice =
                    item.getSalePrice() != null &&
                    item.getSalePrice().compareTo(BigDecimal.ZERO) > 0;

            if (!hasValidPercent && !hasValidSalePrice) {
                continue;
            }

            int saleQuantity =
                    item.getSaleQuantity() == null
                            ? 0
                            : item.getSaleQuantity();

            int soldQuantity =
                    item.getSoldQuantity() == null
                            ? 0
                            : item.getSoldQuantity();

            int remainingQuantity =
                    Math.max(
                            0,
                            saleQuantity - soldQuantity
                    );

            if (remainingQuantity < quantity) {
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
                    item.getLimitPerUser();

            if (
                    limitPerUser != null &&
                    limitPerUser > 0 &&
                    quantity > limitPerUser
            ) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Mỗi khách hàng chỉ được mua tối đa "
                                + limitPerUser
                                + " sản phẩm Flash Sale"
                );
            }

            return item;
        }

        return null;
    }

    private BigDecimal resolveRegularPriceWithOptions(
            Product product,
            String selectedOptionsJson
    ) {
        BigDecimal basePrice =
                product.getPrice() == null
                        ? BigDecimal.ZERO
                        : product.getPrice();

        if (isBlank(selectedOptionsJson)) {
            return basePrice;
        }

        try {
            Map<String, Object> selectedOptions =
                    objectMapper.readValue(
                            selectedOptionsJson,
                            new TypeReference<Map<String, Object>>() {
                            }
                    );

            BigDecimal maxPrice =
                    basePrice;

            for (Object optionValue : selectedOptions.values()) {
                if (!(optionValue instanceof Map<?, ?> optionMap)) {
                    continue;
                }

                Object priceValue =
                        optionMap.get("price");

                BigDecimal optionPrice =
                        parseOptionPrice(priceValue);

                if (optionPrice.compareTo(maxPrice) > 0) {
                    maxPrice =
                            optionPrice;
                }
            }

            return maxPrice;
        } catch (Exception exception) {
            return basePrice;
        }
    }

    private BigDecimal parseOptionPrice(
            Object value
    ) {
        if (value == null) {
            return BigDecimal.ZERO;
        }

        if (value instanceof Number numberValue) {
            return BigDecimal.valueOf(
                    numberValue.doubleValue()
            );
        }

        String normalized =
                String.valueOf(value)
                        .replaceAll("[^0-9]", "");

        if (normalized.isEmpty()) {
            return BigDecimal.ZERO;
        }

        return new BigDecimal(normalized);
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

    private static class ResolvedCheckoutPrice {

        private final BigDecimal unitPrice;

        private final String priceSource;

        private final FlashSaleItem flashSaleItem;

        private ResolvedCheckoutPrice(
                BigDecimal unitPrice,
                String priceSource,
                FlashSaleItem flashSaleItem
        ) {
            this.unitPrice =
                    unitPrice;

            this.priceSource =
                    priceSource;

            this.flashSaleItem =
                    flashSaleItem;
        }

        public BigDecimal getUnitPrice() {
            return unitPrice;
        }

        public String getPriceSource() {
            return priceSource;
        }

        public FlashSaleItem getFlashSaleItem() {
            return flashSaleItem;
        }
    }
}
