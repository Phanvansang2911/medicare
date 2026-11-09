package com.example.medicare.dto;

import com.example.medicare.entity.DoctorSchedule;

import java.time.LocalDate;
import java.time.LocalTime;

public record ScheduleResponse(
        Long id,
        Long doctorId,
        Short dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        boolean active
) {
    public static ScheduleResponse from(DoctorSchedule s) {
        return new ScheduleResponse(
                s.getId(),
                s.getDoctor().getId(),
                s.getDayOfWeek(),
                s.getStartTime(),
                s.getEndTime(),
                s.getEffectiveFrom(),
                s.getEffectiveTo(),
                s.isActive()
        );
    }
}