package com.example.electroshop.config;

import com.example.electroshop.security.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        /*
                         * Preflight CORS
                         */
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        )
                        .permitAll()

                        /*
                         * Auth public
                         */
                        .requestMatchers(
                                "/api/auth/**",
                                "/uploads/**"
                        )
                        .permitAll()

                        /*
                         * VNPAY return/callback phải public
                         * Vì VNPAY redirect từ bên ngoài về, không có JWT token.
                         */
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/payments/vnpay/**"
                        )
                        .permitAll()

                        /*
                         * Public GET cho trang khách
                         */
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/products/**",
                                "/api/categories/**",
                                "/api/brands/**"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/banners/active",
                                "/api/banners/position/**"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/home-sections/active"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/home-section-banners/**"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/promotions/active"
                        )
                        .permitAll()

                        .requestMatchers(
        HttpMethod.GET,
        "/api/flash-sales/active",
        "/api/flash-sales/active-list",
        "/api/flash-sales/active/product/**"
)
.permitAll()

                        /*
                         * Tạm giữ public GET coupon để homepage không bị lỗi.
                         */
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/coupons"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/coupons/apply"
                        )
                        .permitAll()

                        /*
                         * API Admin - Product
                         */
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/products/**"
                        )
                        .hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/products/**"
                        )
                        .hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/products/**"
                        )
                        .hasRole("ADMIN")

                        /*
                         * API Admin - Category / Brand
                         */
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/categories/**",
                                "/api/brands/**"
                        )
                        .hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/categories/**",
                                "/api/brands/**"
                        )
                        .hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/categories/**",
                                "/api/brands/**"
                        )
                        .hasRole("ADMIN")

                        /*
                         * API Admin - Upload ảnh
                         */
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/upload"
                        )
                        .hasRole("ADMIN")

                        /*
                         * API Admin - Banner / HomeSection
                         */
                        .requestMatchers(
                                "/api/banners/**",
                                "/api/home-sections/**"
                        )
                        .hasRole("ADMIN")

                        /*
                         * API Admin - Coupon / Promotion / Flash sale
                         */
                        .requestMatchers(
                                "/api/coupons/**",
                                "/api/promotions/**",
                                "/api/flash-sales/**"
                        )
                        .hasRole("ADMIN")

                        /*
                         * API Admin - User management nếu có
                         */
                        .requestMatchers(
                                "/api/admin/**"
                        )
                        .hasRole("ADMIN")

                        /*
                         * Order / Checkout cần đăng nhập
                         */
                        /*
 * Order Admin
 */
.requestMatchers(
        HttpMethod.GET,
        "/api/orders"
)
.hasRole("ADMIN")

.requestMatchers(
        HttpMethod.GET,
        "/api/orders/*"
)
.hasRole("ADMIN")

.requestMatchers(
        HttpMethod.PUT,
        "/api/orders/*/status"
)
.hasRole("ADMIN")

/*
 * Order User
 */
.requestMatchers(
        HttpMethod.GET,
        "/api/orders/user/**"
)
.authenticated()

.requestMatchers(
        HttpMethod.PUT,
        "/api/orders/*/cancel"
)
.authenticated()

/*
 * Checkout cần đăng nhập
 */
.requestMatchers(
        "/api/checkout/**"
)
.authenticated()

                        /*
                         * Payment API còn lại cần đăng nhập.
                         * Chỉ riêng /api/payments/vnpay/** GET được public ở trên.
                         */
                        .requestMatchers(
                                "/api/payments/**"
                        )
                        .authenticated()

                        /*
                         * Còn lại phải đăng nhập.
                         */
                        .anyRequest()
                        .authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOriginPatterns(
                List.of(
                        "http://localhost:5173",
                        "https://*.ngrok-free.dev"
                )
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}