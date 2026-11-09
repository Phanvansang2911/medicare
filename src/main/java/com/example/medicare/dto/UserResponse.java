package com.example.medicare.dto;

import com.example.medicare.entity.User;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String phone,
        String role,
        String status
) {
    public static UserResponse from(User u) {
        return new UserResponse(
                u.getId(),
                u.getEmail(),
                u.getFullName(),
                u.getPhone(),
                u.getRole().name(),
                u.getStatus().name()
        );
    }
}