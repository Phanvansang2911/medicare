package com.example.medicare.dto;

import com.example.medicare.entity.Slot;

import java.time.LocalDate;
import java.time.LocalTime;

public record SlotResponse(
        Long id,
        Long doctorId,
        LocalDate slotDate,
        LocalTime startTime,
        LocalTime endTime,
        String status
) {
    public static SlotResponse from(Slot s) {
        return new SlotResponse(
                s.getId(),
                s.getDoctor().getId(),
                s.getSlotDate(),
                s.getStartTime(),
                s.getEndTime(),
                s.getStatus().name()
        );
    }
}