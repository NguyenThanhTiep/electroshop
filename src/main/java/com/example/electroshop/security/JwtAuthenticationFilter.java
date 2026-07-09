package com.example.electroshop.security;

import com.example.electroshop.entity.User;
import com.example.electroshop.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter
        extends OncePerRequestFilter {

    private final JwtService jwtService;

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader =
                request.getHeader("Authorization");

        if (
                authHeader == null ||
                !authHeader.startsWith("Bearer ")
        ) {
            filterChain.doFilter(request, response);
            return;
        }

        String token =
                authHeader.substring(7);

        try {
            String email =
                    jwtService.extractEmail(token);

            if (
                    email != null &&
                    SecurityContextHolder
                            .getContext()
                            .getAuthentication() == null
            ) {
                User user =
                        userRepository
                                .findByEmail(email)
                                .orElse(null);

                if (
                        user != null &&
                        !Boolean.TRUE.equals(user.getLocked()) &&
                        jwtService.isTokenValid(
                                token,
                                user.getEmail()
                        )
                ) {
                    String role =
                            user.getRole() == null
                                    ? "USER"
                                    : user
                                            .getRole()
                                            .trim()
                                            .toUpperCase()
                                            .replaceFirst("^ROLE_", "");

                    SimpleGrantedAuthority authority =
                            new SimpleGrantedAuthority(
                                    "ROLE_" + role
                            );

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    user.getEmail(),
                                    null,
                                    List.of(authority)
                            );

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(authToken);
                }
            }
        } catch (Exception error) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
