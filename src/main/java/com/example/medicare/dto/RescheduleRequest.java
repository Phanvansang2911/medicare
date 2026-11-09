package com.example.medicare.dto;

import jakarta.validation.constraints.NotNull;

public record RescheduleRequest(
        @NotNull Long newSlotId
) {}