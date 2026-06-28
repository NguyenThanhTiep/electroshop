package com.example.electroshop.repository;

import com.example.electroshop.entity.Order;
import com.example.electroshop.entity.enums.OrderStatus;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository
        extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderCode(
            String orderCode
    );

    /*
     * Người dùng lấy danh sách đơn
     * của chính mình, kèm sản phẩm.
     */
    @EntityGraph(
            attributePaths = "items"
    )
    List<Order>
    findByUserIdOrderByCreatedAtDesc(
            Long userId
    );

    boolean existsByUserId(
        Long userId
);

    /*
     * Người dùng xem chi tiết đơn
     * thuộc đúng userId.
     */
    @EntityGraph(
            attributePaths = "items"
    )
    @Query("""
        SELECT o
        FROM Order o
        WHERE o.id = :orderId
          AND o.userId = :userId
    """)
    Optional<Order>
    findByIdAndUserIdWithItems(
            @Param("orderId")
            Long orderId,

            @Param("userId")
            Long userId
    );

    /*
     * Admin lấy tất cả đơn,
     * kèm danh sách sản phẩm.
     */
    @EntityGraph(
            attributePaths = "items"
    )
    @Query("""
        SELECT DISTINCT o
        FROM Order o
        ORDER BY o.createdAt DESC
    """)
    List<Order> findAllWithItems();

    /*
     * Admin xem chi tiết một đơn.
     */
    @EntityGraph(
            attributePaths = "items"
    )
    @Query("""
        SELECT o
        FROM Order o
        WHERE o.id = :orderId
    """)
    Optional<Order> findByIdWithItems(
            @Param("orderId")
            Long orderId
    );

    /*
     * Khóa đơn trong lúc:
     * - cập nhật trạng thái;
     * - hủy đơn;
     * - hoàn tồn kho;
     * - cập nhật lợi ích Flash Sale/Coupon.
     */
    @Lock(
            LockModeType.PESSIMISTIC_WRITE
    )
    @Query("""
        SELECT o
        FROM Order o
        WHERE o.id = :orderId
    """)
    Optional<Order> findByIdForUpdate(
            @Param("orderId")
            Long orderId
    );

    /*
     * Kiểm tra người dùng đã mua sản phẩm
     * trong một đơn có trạng thái yêu cầu.
     *
     * Khi truyền OrderStatus.COMPLETED,
     * chỉ đơn hoàn thành mới hợp lệ.
     */
    @Query("""
        SELECT CASE
            WHEN COUNT(o) > 0
            THEN true
            ELSE false
        END
        FROM Order o
        JOIN o.items i
        WHERE o.userId = :userId
          AND i.productId = :productId
          AND o.orderStatus = :orderStatus
    """)
    boolean existsOrderContainingProduct(
            @Param("userId")
            Long userId,

            @Param("productId")
            Long productId,

            @Param("orderStatus")
            OrderStatus orderStatus
    );

    boolean existsByCouponCodeIgnoreCase(String couponCode);
    boolean existsByOrderCode(
            String orderCode
    );
}