package com.example.medicare.dto;

import jakarta.validation.constraints.*;

public record DoctorCreateRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Size(max = 150) String fullName,
        @Size(max = 20) String phone,
        @NotNull Long specialtyId,
        @Size(max = 100) String degree,
        String description
) {}