package com.example.electroshop.entity;

import com.example.electroshop.entity.enums.PaymentStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "payments",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_payment_txn_ref",
            columnNames = "txn_ref"
        )
    }
)
public class Payment {

    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    private Long id;

    @ManyToOne(
        fetch = FetchType.LAZY,
        optional = false
    )
    @JoinColumn(
        name = "order_id",
        nullable = false
    )
    @JsonIgnore
    private Order order;

    @Column(
        nullable = false,
        length = 30
    )
    private String provider = "VNPAY";

    /*
     * Giá trị gửi sang vnp_TxnRef.
     */
    @Column(
        name = "txn_ref",
        nullable = false,
        unique = true,
        length = 100
    )
    private String txnRef;

    @Column(
        nullable = false,
        precision = 15,
        scale = 2
    )
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(
        nullable = false,
        length = 30
    )
    private PaymentStatus status =
            PaymentStatus.UNPAID;

    @Column(
        name = "vnp_transaction_no",
        length = 100
    )
    private String vnpTransactionNo;

    @Column(
        name = "vnp_response_code",
        length = 20
    )
    private String vnpResponseCode;

    @Column(
        name = "vnp_transaction_status",
        length = 20
    )
    private String vnpTransactionStatus;

    @Column(
        name = "bank_code",
        length = 50
    )
    private String bankCode;

    @Column(
        name = "card_type",
        length = 50
    )
    private String cardType;

    @Column(
        name = "pay_date",
        length = 30
    )
    private String payDate;

    @Column(
        name = "failure_reason",
        length = 1000
    )
    private String failureReason;

    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    )
    private LocalDateTime createdAt;

    @Column(
        name = "updated_at",
        nullable = false
    )
    private LocalDateTime updatedAt;

    @PrePersist
    public void beforeCreate() {

        LocalDateTime now =
                LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status = PaymentStatus.UNPAID;
        }
    }

    @PreUpdate
    public void beforeUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(
        Long id
    ) {
        this.id = id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(
        Order order
    ) {
        this.order = order;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(
        String provider
    ) {
        this.provider = provider;
    }

    public String getTxnRef() {
        return txnRef;
    }

    public void setTxnRef(
        String txnRef
    ) {
        this.txnRef = txnRef;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(
        BigDecimal amount
    ) {
        this.amount = amount;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(
        PaymentStatus status
    ) {
        this.status = status;
    }

    public String getVnpTransactionNo() {
        return vnpTransactionNo;
    }

    public void setVnpTransactionNo(
        String vnpTransactionNo
    ) {
        this.vnpTransactionNo =
                vnpTransactionNo;
    }

    public String getVnpResponseCode() {
        return vnpResponseCode;
    }

    public void setVnpResponseCode(
        String vnpResponseCode
    ) {
        this.vnpResponseCode =
                vnpResponseCode;
    }

    public String getVnpTransactionStatus() {
        return vnpTransactionStatus;
    }

    public void setVnpTransactionStatus(
        String vnpTransactionStatus
    ) {
        this.vnpTransactionStatus =
                vnpTransactionStatus;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(
        String bankCode
    ) {
        this.bankCode = bankCode;
    }

    public String getCardType() {
        return cardType;
    }

    public void setCardType(
        String cardType
    ) {
        this.cardType = cardType;
    }

    public String getPayDate() {
        return payDate;
    }

    public void setPayDate(
        String payDate
    ) {
        this.payDate = payDate;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(
        String failureReason
    ) {
        this.failureReason =
                failureReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}