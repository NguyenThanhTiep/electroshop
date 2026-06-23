package com.example.electroshop.controller;

import com.example.electroshop.entity.Order;
import com.example.electroshop.entity.enums.OrderStatus;
import com.example.electroshop.service.OrderService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(
        origins = "http://localhost:5173"
)
public class OrderController {

    private final OrderService
            orderService;

    public OrderController(
            OrderService orderService
    ) {
        this.orderService =
                orderService;
    }

    /*
     * Admin lấy toàn bộ đơn.
     */
    @GetMapping
    public List<Order> getOrders() {
        return orderService
                .getAllOrders();
    }

    /*
     * Người dùng chỉ lấy đơn của mình.
     */
    @GetMapping("/user/{userId}")
    public List<Order> getOrdersByUser(
            @PathVariable Long userId
    ) {
        return orderService
                .getOrdersByUser(
                        userId
                );
    }

    /*
     * Người dùng xem chi tiết đơn
     * thuộc chính tài khoản đó.
     */
    @GetMapping(
            "/user/{userId}/{orderId}"
    )
    public Order getOrderByUser(
            @PathVariable Long userId,
            @PathVariable Long orderId
    ) {
        return orderService
                .getOrderByUser(
                        orderId,
                        userId
                );
    }

    /*
     * Admin xem chi tiết một đơn.
     */
    @GetMapping("/{id}")
    public Order getOrderById(
            @PathVariable Long id
    ) {
        return orderService
                .getOrderById(id);
    }

    /*
     * Admin cập nhật trạng thái đơn.
     */
    @PutMapping("/{id}/status")
    public Order updateOrderStatus(
            @PathVariable Long id,
            @RequestParam
            OrderStatus status
    ) {
        return orderService
                .updateOrderStatus(
                        id,
                        status
                );
    }

    /*
     * Người dùng hủy đơn của mình.
     */
    @PutMapping("/{id}/cancel")
    public Order cancelOrder(
            @PathVariable Long id,
            @RequestParam Long userId
    ) {
        return orderService
                .cancelOrderByUser(
                        id,
                        userId
                );
    }
}