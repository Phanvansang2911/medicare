package com.example.medicare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DoctorUpdateRequest(
        @NotBlank @Size(max = 150) String fullName,
        @Size(max = 20) String phone,
        @Size(max = 100) String degree,
        String description
) {}