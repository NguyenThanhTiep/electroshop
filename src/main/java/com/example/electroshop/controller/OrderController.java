package com.example.electroshop.controller;

import com.example.electroshop.entity.Order;
import com.example.electroshop.entity.User;
import com.example.electroshop.entity.enums.OrderStatus;
import com.example.electroshop.repository.UserRepository;
import com.example.electroshop.service.OrderService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(
            OrderService orderService,
            UserRepository userRepository
    ) {
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    /*
     * Admin lấy toàn bộ đơn.
     * Quyền admin sẽ được chặn trong SecurityConfig.
     */
    @GetMapping
    public List<Order> getOrders() {
        return orderService.getAllOrders();
    }

    /*
     * User chỉ được xem đơn của chính mình.
     * Admin được xem đơn của user bất kỳ.
     */
    @GetMapping("/user/{userId}")
    public List<Order> getOrdersByUser(
            @PathVariable Long userId,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);

        if (
                !isAdmin(currentUser) &&
                !Objects.equals(currentUser.getId(), userId)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn không có quyền xem đơn hàng của tài khoản này"
            );
        }

        return orderService.getOrdersByUser(userId);
    }

    /*
     * User chỉ được xem chi tiết đơn của chính mình.
     * Admin được xem chi tiết đơn của user bất kỳ.
     */
    @GetMapping("/user/{userId}/{orderId}")
    public Order getOrderByUser(
            @PathVariable Long userId,
            @PathVariable Long orderId,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);

        if (
                !isAdmin(currentUser) &&
                !Objects.equals(currentUser.getId(), userId)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn không có quyền xem đơn hàng này"
            );
        }

        return orderService.getOrderByUser(orderId, userId);
    }

    /*
     * Admin xem chi tiết một đơn.
     * Quyền admin sẽ được chặn trong SecurityConfig.
     */
    @GetMapping("/{id}")
    public Order getOrderById(
            @PathVariable Long id
    ) {
        return orderService.getOrderById(id);
    }

    /*
     * Admin cập nhật trạng thái đơn.
     * Quyền admin sẽ được chặn trong SecurityConfig.
     */
    @PutMapping("/{id}/status")
    public Order updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status
    ) {
        return orderService.updateOrderStatus(id, status);
    }

    /*
     * User hủy đơn của chính mình.
     * Không nhận userId từ frontend nữa.
     */
    @PutMapping("/{id}/cancel")
    public Order cancelOrder(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);

        return orderService.cancelOrderByUser(
                id,
                currentUser.getId()
        );
    }

    private User getCurrentUser(
            Authentication authentication
    ) {
        if (
                authentication == null ||
                authentication.getName() == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Bạn chưa đăng nhập"
            );
        }

        String email = authentication.getName();

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Tài khoản không hợp lệ"
                        )
                );
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null &&
                user.getRole().equalsIgnoreCase("admin");
    }
}