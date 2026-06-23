package com.example.electroshop.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class VnPayConfig {

    @Value("${vnpay.version:2.1.0}")
    private String version;

    @Value("${vnpay.command:pay}")
    private String command;

    @Value("${vnpay.tmn-code:}")
    private String tmnCode;

    @Value("${vnpay.hash-secret:}")
    private String hashSecret;

    @Value("${vnpay.pay-url}")
    private String payUrl;

    @Value("${vnpay.currency:VND}")
    private String currency;

    @Value("${vnpay.locale:vn}")
    private String locale;

    @Value("${vnpay.order-type:other}")
    private String orderType;

    @Value("${app.public-base-url}")
    private String publicBaseUrl;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public String getVersion() {
        return version;
    }

    public String getCommand() {
        return command;
    }

    public String getTmnCode() {
        return tmnCode;
    }

    public String getHashSecret() {
        return hashSecret;
    }

    public String getPayUrl() {
        return payUrl;
    }

    public String getCurrency() {
        return currency;
    }

    public String getLocale() {
        return locale;
    }

    public String getOrderType() {
        return orderType;
    }

    public String getPublicBaseUrl() {
        return removeEndingSlash(publicBaseUrl);
    }

    public String getFrontendUrl() {
        return removeEndingSlash(frontendUrl);
    }

    public String getReturnUrl() {
        return getPublicBaseUrl()
                + "/api/payments/vnpay/return";
    }

    public String getIpnUrl() {
        return getPublicBaseUrl()
                + "/api/payments/vnpay/ipn";
    }

    private String removeEndingSlash(
            String value
    ) {
        if (value == null) {
            return "";
        }

        return value.replaceAll("/+$", "");
    }
}