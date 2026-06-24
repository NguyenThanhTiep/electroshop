package com.example.electroshop.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.ResponseEntity;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import org.springframework.web.bind.annotation.*;

import com.example.electroshop.dto.LoginRequest;
import com.example.electroshop.dto.RegisterRequest;

import com.example.electroshop.dto.AuthResponse;

import com.example.electroshop.entity.User;

import com.example.electroshop.repository.UserRepository;

import com.example.electroshop.security.JwtService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private BCryptPasswordEncoder encoder =
            new BCryptPasswordEncoder();

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request
    ) {

        if (
                request.getLastName() == null ||
                request.getLastName().trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body("Vui lòng nhập họ");
        }

        if (
                request.getFirstName() == null ||
                request.getFirstName().trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body("Vui lòng nhập tên");
        }

        if (
                request.getEmail() == null ||
                request.getEmail().trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body("Vui lòng nhập email");
        }

        if (
                request.getPhone() == null ||
                request.getPhone().trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body("Vui lòng nhập số điện thoại");
        }

        if (
                request.getPassword() == null ||
                request.getPassword().length() < 5
        ) {

            return ResponseEntity
                    .badRequest()
                    .body("Mật khẩu phải có ít nhất 5 ký tự");
        }

        if (
                userRepository
                        .findByEmail(
                                request.getEmail()
                        )
                        .isPresent()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body("Email đã tồn tại");
        }

        if (
                userRepository
                        .findByPhone(
                                request.getPhone()
                        )
                        .isPresent()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body("Số điện thoại đã tồn tại");
        }

        User user = new User();

        user.setLastName(
                request.getLastName()
        );

        user.setFirstName(
                request.getFirstName()
        );

        user.setFullName(
                request.getLastName()
                        + " "
                        + request.getFirstName()
        );

        user.setEmail(
                request.getEmail()
        );

        user.setPhone(
                request.getPhone()
        );

        user.setPassword(
                encoder.encode(
                        request.getPassword()
                )
        );

        user.setRole(
                "user"
        );

        userRepository.save(user);

        return ResponseEntity.ok(
                "Đăng ký thành công"
        );
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request
    ) {

        if (
                request.getEmail() == null ||
                request.getEmail().trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body("Vui lòng nhập email hoặc số điện thoại");
        }

        if (
                request.getPassword() == null ||
                request.getPassword().trim().isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body("Vui lòng nhập mật khẩu");
        }

        User user =
                userRepository
                        .findByEmail(
                                request.getEmail()
                        )
                        .orElseGet(() ->
                                userRepository
                                        .findByPhone(
                                                request.getEmail()
                                        )
                                        .orElse(null)
                        );

        if (user == null) {

            return ResponseEntity
                    .badRequest()
                    .body("Sai tài khoản hoặc mật khẩu");
        }

if (Boolean.TRUE.equals(user.getLocked())) {

    return ResponseEntity
            .status(403)
            .body("Tài khoản đã bị khóa");
}

        boolean isMatch =
                encoder.matches(
                        request.getPassword(),
                        user.getPassword()
                );

        if (!isMatch) {

            return ResponseEntity
                    .badRequest()
                    .body("Sai tài khoản hoặc mật khẩu");
        }

        String token =
                jwtService.generateToken(
                        user.getEmail()
                );

AuthResponse response =
        new AuthResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                token
        );

return ResponseEntity.ok(
        response
);
    }
}