package com.example.electroshop.controller;

import com.example.electroshop.config.VnPayConfig;
import com.example.electroshop.service.VnPayCallbackService;
import com.example.electroshop.service.VnPayService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/vnpay")
@CrossOrigin(origins = "http://localhost:5173")
public class VnPayController {

    private final VnPayService vnPayService;

    private final VnPayCallbackService
            callbackService;

    private final VnPayConfig config;

    public VnPayController(
            VnPayService vnPayService,
            VnPayCallbackService callbackService,
            VnPayConfig config
    ) {
        this.vnPayService =
                vnPayService;

        this.callbackService =
                callbackService;

        this.config = config;
    }

    /*
     * VNPAY gọi trực tiếp vào API này.
     * Đây mới là nơi cập nhật database.
     */
    @GetMapping("/ipn")
    public ResponseEntity<
            Map<String, String>
    > handleIpn(
            @RequestParam
            Map<String, String> params
    ) {
        try {
            return ResponseEntity.ok(
                    callbackService
                            .processIpn(params)
            );

        } catch (Exception exception) {
            exception.printStackTrace();

            return ResponseEntity.ok(
                    Map.of(
                            "RspCode", "99",
                            "Message", "Unknown error"
                    )
            );
        }
    }

    /*
     * Trình duyệt khách được VNPAY
     * chuyển về URL này.
     *
     * Không cập nhật database ở đây.
     */
    @GetMapping("/return")
public ResponseEntity<Void> handleReturn(
        @RequestParam
        Map<String, String> params
) {
    boolean validSignature =
            vnPayService.verifySignature(params);

    String txnRef =
            params.getOrDefault(
                    "vnp_TxnRef",
                    ""
            );

    String responseCode =
            params.getOrDefault(
                    "vnp_ResponseCode",
                    ""
            );

    String transactionStatus =
            params.getOrDefault(
                    "vnp_TransactionStatus",
                    ""
            );

    /*
     * FIX NHANH CHO DEMO:
     * Nếu chữ ký hợp lệ, xử lý Return URL
     * giống IPN để cập nhật database.
     *
     * processIpn() vẫn kiểm tra:
     * - Chữ ký
     * - Mã giao dịch
     * - Số tiền
     * - Trạng thái giao dịch
     * - Chống cập nhật nhiều lần
     */
    if (validSignature) {
        try {
            Map<String, String> result =
                    callbackService.processIpn(
                            params
                    );

            System.out.println(
                    "VNPAY Return fallback: "
                            + result
            );

        } catch (Exception exception) {
            exception.printStackTrace();

            System.out.println(
                    "Không thể cập nhật thanh toán "
                            + "từ Return URL"
            );
        }
    } else {
        System.out.println(
                "VNPAY Return: chữ ký không hợp lệ"
        );
    }

    String redirectUrl =
            config.getFrontendUrl()
                    + "/payment-result"
                    + "?txnRef="
                    + encode(txnRef)
                    + "&responseCode="
                    + encode(responseCode)
                    + "&transactionStatus="
                    + encode(transactionStatus)
                    + "&validSignature="
                    + validSignature;

    return ResponseEntity
            .status(HttpStatus.FOUND)
            .location(
                    URI.create(redirectUrl)
            )
            .build();
}

    /*
     * Frontend gọi API này để lấy
     * trạng thái thật trong database.
     */
    @GetMapping("/status/{txnRef}")
    public ResponseEntity<
            Map<String, Object>
    > getPaymentStatus(
            @PathVariable String txnRef
    ) {
        return ResponseEntity.ok(
                callbackService
                        .getPaymentStatus(txnRef)
        );
    }

    private String encode(
            String value
    ) {
        return URLEncoder.encode(
                value,
                StandardCharsets.UTF_8
        );
    }
}