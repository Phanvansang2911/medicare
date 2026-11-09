package com.example.medicare.dto;

import jakarta.validation.constraints.NotBlank;

public record CompleteRequest(@NotBlank String doctorNote) {}