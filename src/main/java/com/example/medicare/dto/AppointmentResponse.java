package com.example.medicare.dto;

import com.example.medicare.entity.Appointment;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentResponse(
        Long id,
        Long slotId,
        Long doctorId,
        String doctorName,
        String specialtyName,
        Long patientId,
        String patientName,
        String patientPhone,
        LocalDate slotDate,
        LocalTime startTime,
        LocalTime endTime,
        String status,
        String reason,
        String doctorNote,
        String rejectReason,
        String cancelReason,
        Instant bookedAt,
        Instant confirmedAt,
        Instant arrivedAt,
        Instant completedAt
) {
    public static AppointmentResponse from(Appointment a) {
        return new AppointmentResponse(
                a.getId(),
                a.getSlot().getId(),
                a.getDoctor().getId(),
                a.getDoctor().getUser().getFullName(),
                a.getDoctor().getSpecialty().getName(),
                a.getPatient().getId(),
                a.getPatient().getUser().getFullName(),
                a.getPatient().getUser().getPhone(),
                a.getSlot().getSlotDate(),
                a.getSlot().getStartTime(),
                a.getSlot().getEndTime(),
                a.getStatus().name(),
                a.getReason(),
                a.getDoctorNote(),
                a.getRejectReason(),
                a.getCancelReason(),
                a.getBookedAt(),
                a.getConfirmedAt(),
                a.getArrivedAt(),
                a.getCompletedAt()
        );
    }
}