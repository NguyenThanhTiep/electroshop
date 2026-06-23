package com.example.electroshop.service;

import com.example.electroshop.config.VnPayConfig;
import com.example.electroshop.entity.Payment;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class VnPayService {

    private static final String HMAC_SHA512 =
            "HmacSHA512";

    private static final ZoneId VIETNAM_ZONE =
            ZoneId.of("Asia/Ho_Chi_Minh");

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern(
                    "yyyyMMddHHmmss"
            );

    private final VnPayConfig config;

    public VnPayService(
            VnPayConfig config
    ) {
        this.config = config;
    }

    /*
     * Tạo URL chuyển khách hàng
     * sang VNPAY Sandbox.
     */
    public String createPaymentUrl(
            Payment payment,
            String clientIp
    ) {
        validateConfiguration();

        ZonedDateTime createTime =
                ZonedDateTime.now(VIETNAM_ZONE);

        ZonedDateTime expireTime =
                createTime.plusMinutes(15);

        /*
         * VNPAY yêu cầu số tiền nhân 100.
         *
         * Ví dụ:
         * 20.500.000 VND
         * -> 2.050.000.000
         */
        String vnpAmount =
                payment.getAmount()
                        .multiply(
                                BigDecimal.valueOf(100)
                        )
                        .setScale(
                                0,
                                RoundingMode.UNNECESSARY
                        )
                        .toPlainString();

        TreeMap<String, String> params =
                new TreeMap<>();

        params.put(
                "vnp_Version",
                config.getVersion().trim()
        );

        params.put(
                "vnp_Command",
                config.getCommand().trim()
        );

        params.put(
                "vnp_TmnCode",
                config.getTmnCode().trim()
        );

        params.put(
                "vnp_Amount",
                vnpAmount
        );

        params.put(
                "vnp_CurrCode",
                config.getCurrency().trim()
        );

        params.put(
                "vnp_TxnRef",
                payment.getTxnRef().trim()
        );

        params.put(
                "vnp_OrderInfo",
                "Thanh toan don hang "
                        + payment
                        .getOrder()
                        .getOrderCode()
        );

        params.put(
                "vnp_OrderType",
                config.getOrderType().trim()
        );

        params.put(
                "vnp_Locale",
                config.getLocale().trim()
        );

        params.put(
                "vnp_ReturnUrl",
                config.getReturnUrl()
        );

        params.put(
                "vnp_IpAddr",
                normalizeIp(clientIp)
        );

        params.put(
                "vnp_CreateDate",
                createTime.format(
                        DATE_FORMATTER
                )
        );

        params.put(
                "vnp_ExpireDate",
                expireTime.format(
                        DATE_FORMATTER
                )
        );

        /*
         * Chuỗi dùng để ký.
         */
        String hashData =
                buildHashData(params);

        /*
         * Chuỗi được gắn vào URL.
         */
        String queryString =
                buildQueryString(params);

        String secureHash =
                hmacSha512(
                        config
                                .getHashSecret()
                                .trim(),
                        hashData
                );

        /*
         * Chỉ dùng để kiểm tra khi đang sửa lỗi.
         * Không in HashSecret ra Terminal.
         */
        System.out.println(
                "VNPAY TmnCode: "
                        + config.getTmnCode().trim()
        );

        System.out.println(
                "VNPAY Return URL: "
                        + config.getReturnUrl()
        );

        System.out.println(
                "VNPAY Hash data: "
                        + hashData
        );

        return config.getPayUrl()
                + "?"
                + queryString
                + "&vnp_SecureHash="
                + secureHash;
    }

    /*
     * Xác minh chữ ký của dữ liệu
     * VNPAY gửi về Return URL hoặc IPN.
     */
    public boolean verifySignature(
            Map<String, String> responseParams
    ) {
        if (responseParams == null ||
                responseParams.isEmpty()) {

            return false;
        }

        String receivedHash =
                responseParams.get(
                        "vnp_SecureHash"
                );

        if (receivedHash == null ||
                receivedHash.isBlank()) {

            return false;
        }

        TreeMap<String, String> params =
                new TreeMap<>();

        for (
            Map.Entry<String, String> entry
            : responseParams.entrySet()
        ) {
            String key = entry.getKey();
            String value = entry.getValue();

            if (key == null ||
                    !key.startsWith("vnp_")) {

                continue;
            }

            if (
                "vnp_SecureHash".equals(key) ||
                "vnp_SecureHashType".equals(key)
            ) {
                continue;
            }

            if (value == null ||
                    value.isBlank()) {

                continue;
            }

            params.put(key, value);
        }

        String hashData =
                buildHashData(params);

        String expectedHash =
                hmacSha512(
                        config
                                .getHashSecret()
                                .trim(),
                        hashData
                );

        return MessageDigest.isEqual(
                expectedHash
                        .toLowerCase()
                        .getBytes(
                                StandardCharsets.US_ASCII
                        ),
                receivedHash
                        .trim()
                        .toLowerCase()
                        .getBytes(
                                StandardCharsets.US_ASCII
                        )
        );
    }

    /*
     * Chuỗi dùng để tạo checksum.
     *
     * Ví dụ:
     * vnp_Amount=2050000000&
     * vnp_Command=pay&...
     */
    private String buildHashData(
            Map<String, String> params
    ) {
        return params
                .entrySet()
                .stream()
                .filter(entry ->
                        entry.getValue() != null &&
                        !entry.getValue().isBlank()
                )
                .map(entry ->
                        entry.getKey()
                                + "="
                                + encode(
                                        entry.getValue()
                                )
                )
                .collect(
                        Collectors.joining("&")
                );
    }

    /*
     * Chuỗi tham số được gắn lên URL.
     */
    private String buildQueryString(
            Map<String, String> params
    ) {
        return params
                .entrySet()
                .stream()
                .filter(entry ->
                        entry.getValue() != null &&
                        !entry.getValue().isBlank()
                )
                .map(entry ->
                        encode(entry.getKey())
                                + "="
                                + encode(
                                        entry.getValue()
                                )
                )
                .collect(
                        Collectors.joining("&")
                );
    }

    private String encode(
            String value
    ) {
        return URLEncoder.encode(
                value,
                StandardCharsets.US_ASCII
        );
    }

    private String hmacSha512(
            String secretKey,
            String data
    ) {
        try {
            Mac mac =
                    Mac.getInstance(
                            HMAC_SHA512
                    );

            SecretKeySpec secretKeySpec =
                    new SecretKeySpec(
                            secretKey.getBytes(
                                    StandardCharsets.UTF_8
                            ),
                            HMAC_SHA512
                    );

            mac.init(secretKeySpec);

            byte[] hashBytes =
                    mac.doFinal(
                            data.getBytes(
                                    StandardCharsets.UTF_8
                            )
                    );

            StringBuilder result =
                    new StringBuilder();

            for (byte hashByte : hashBytes) {
                result.append(
                        String.format(
                                "%02x",
                                hashByte
                        )
                );
            }

            return result.toString();

        } catch (
            GeneralSecurityException exception
        ) {
            throw new IllegalStateException(
                    "Không thể tạo chữ ký VNPAY",
                    exception
            );
        }
    }

    private String normalizeIp(
            String clientIp
    ) {
        if (clientIp == null ||
                clientIp.isBlank()) {

            return "127.0.0.1";
        }

        String ip =
                clientIp
                        .split(",")[0]
                        .trim();

        if (
            "::1".equals(ip) ||
            "0:0:0:0:0:0:0:1".equals(ip)
        ) {
            return "127.0.0.1";
        }

        return ip;
    }

    private void validateConfiguration() {
        if (
            config.getTmnCode() == null ||
            config
                    .getTmnCode()
                    .trim()
                    .isEmpty()
        ) {
            throw new IllegalStateException(
                    "Chưa cấu hình VNPAY_TMN_CODE"
            );
        }

        if (
            config.getHashSecret() == null ||
            config
                    .getHashSecret()
                    .trim()
                    .isEmpty()
        ) {
            throw new IllegalStateException(
                    "Chưa cấu hình VNPAY_HASH_SECRET"
            );
        }

        if (
            config.getPayUrl() == null ||
            config
                    .getPayUrl()
                    .trim()
                    .isEmpty()
        ) {
            throw new IllegalStateException(
                    "Chưa cấu hình URL VNPAY"
            );
        }
    }
}