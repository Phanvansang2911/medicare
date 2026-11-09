package com.example.medicare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AppointmentCreateRequest(
        @NotNull Long slotId,
        @NotBlank @Size(max = 500) String reason
) {}