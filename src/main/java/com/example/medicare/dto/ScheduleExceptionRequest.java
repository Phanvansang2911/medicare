package com.example.medicare.dto;

import com.example.medicare.enums.ScheduleExceptionType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record ScheduleExceptionRequest(
        @NotNull LocalDate date,
        @NotNull ScheduleExceptionType type,
        LocalTime startTime,
        LocalTime endTime,
        String reason
) {}