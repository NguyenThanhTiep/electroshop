package com.example.electroshop.controller;

import com.example.electroshop.dto.admin.AdminUserLockRequest;
import com.example.electroshop.dto.admin.AdminUserResponse;
import com.example.electroshop.entity.User;
import com.example.electroshop.repository.UserRepository;
import com.example.electroshop.repository.OrderRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin("*")
public class AdminUserController {

    private final UserRepository userRepository;

    private final OrderRepository orderRepository;

    public AdminUserController(
            UserRepository userRepository,
            OrderRepository orderRepository
    ) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    @GetMapping
    public List<AdminUserResponse> getUsers() {

        return userRepository
                .findByRoleIgnoreCaseOrderByIdAsc("user")
                .stream()
                .map(AdminUserResponse::fromUser)
                .toList();
    }

    @PatchMapping("/{id}/lock")
    public AdminUserResponse updateUserLock(
            @PathVariable Long id,
            @RequestBody AdminUserLockRequest request
    ) {
        User user =
                userRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy người dùng"
                                )
                        );

        if ("admin".equalsIgnoreCase(user.getRole())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể khóa tài khoản admin"
            );
        }

        Boolean locked =
                Boolean.TRUE.equals(
                        request.getLocked()
                );

        user.setLocked(
                locked
        );

        User savedUser =
                userRepository.save(
                        user
                );

        return AdminUserResponse.fromUser(
                savedUser
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(
            @PathVariable Long id
    ) {
        User user =
                userRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy người dùng"
                                )
                        );

        if ("admin".equalsIgnoreCase(user.getRole())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể xóa tài khoản admin"
            );
        }

        if (orderRepository.existsByUserId(id)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể xóa người dùng đã có đơn hàng. Vui lòng khóa tài khoản thay thế."
            );
        }

        userRepository.delete(
                user
        );

        return ResponseEntity.ok(
                "Xóa người dùng thành công"
        );
    }
}