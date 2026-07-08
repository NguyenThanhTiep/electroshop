package com.example.electroshop.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy =
            GenerationType.IDENTITY)
    private Long id;

    private String lastName;

    private String firstName;

    private String fullName;

    @Column(unique = true)
    private String email;

    @Column(unique = true)
    private String phone;

    private String password;

    private String role = "user";

    @Column(nullable = false)
    private Boolean locked = false;

    private LocalDateTime createdAt;

    public User() {
    }

    public User(
            Long id,
            String lastName,
            String firstName,
            String fullName,
            String email,
            String phone,
            String password,
            String role
    ) {
        this.id = id;
        this.lastName = lastName;
        this.firstName = firstName;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.role = role;
        this.locked = false;
    }

    public Long getId() {

        return id;
    }

    public void setId(
            Long id
    ) {

        this.id = id;
    }

    public String getLastName() {

        return lastName;
    }

    public void setLastName(
            String lastName
    ) {

        this.lastName = lastName;
    }

    public String getFirstName() {

        return firstName;
    }

    public void setFirstName(
            String firstName
    ) {

        this.firstName = firstName;
    }

    public String getFullName() {

        return fullName;
    }

    public void setFullName(
            String fullName
    ) {

        this.fullName = fullName;
    }

    public String getEmail() {

        return email;
    }

    public void setEmail(
            String email
    ) {

        this.email = email;
    }

    public String getPhone() {

        return phone;
    }

    public void setPhone(
            String phone
    ) {

        this.phone = phone;
    }

    public String getPassword() {

        return password;
    }

    public void setPassword(
            String password
    ) {

        this.password = password;
    }

    public String getRole() {

        return role;
    }

    public void setRole(
            String role
    ) {

        this.role = role;
    }

    public Boolean getLocked() {

        return locked;
    }

    public void setLocked(
            Boolean locked
    ) {

        this.locked = locked;
    }

    public LocalDateTime getCreatedAt() {

        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt
    ) {

        this.createdAt = createdAt;
    }

    @PrePersist
    public void prePersist() {

        if (locked == null) {

            locked = false;
        }

        if (createdAt == null) {

            createdAt = LocalDateTime.now();
        }
    }
}
