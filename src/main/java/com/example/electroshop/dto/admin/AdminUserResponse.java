package com.example.electroshop.dto.admin;

import com.example.electroshop.entity.User;
import java.time.LocalDateTime;

public class AdminUserResponse {

    private Long id;

    private String fullName;

    private String email;

    private String phone;

    private String role;

    private Boolean locked;

    private LocalDateTime createdAt;

    public AdminUserResponse() {
    }

    public AdminUserResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            String role,
            Boolean locked,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.locked = locked;
        this.createdAt = createdAt;
    }

    public static AdminUserResponse fromUser(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getLocked(),
                user.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getRole() {
        return role;
    }

    public Boolean getLocked() {
        return locked;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
