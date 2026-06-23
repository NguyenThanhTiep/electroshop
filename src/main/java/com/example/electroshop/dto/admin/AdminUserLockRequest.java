package com.example.electroshop.dto.admin;

public class AdminUserLockRequest {

    private Boolean locked;

    public AdminUserLockRequest() {
    }

    public Boolean getLocked() {
        return locked;
    }

    public void setLocked(Boolean locked) {
        this.locked = locked;
    }
}