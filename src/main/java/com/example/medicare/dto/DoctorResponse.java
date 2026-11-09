package com.example.medicare.dto;

import com.example.medicare.entity.Doctor;

public record DoctorResponse(
        Long id,
        Long userId,
        String fullName,
        String email,
        String phone,
        Long specialtyId,
        String specialtyName,
        String degree,
        String description,
        boolean active
) {
    public static DoctorResponse from(Doctor d) {
        return new DoctorResponse(
                d.getId(),
                d.getUser().getId(),
                d.getUser().getFullName(),
                d.getUser().getEmail(),
                d.getUser().getPhone(),
                d.getSpecialty().getId(),
                d.getSpecialty().getName(),
                d.getDegree(),
                d.getDescription(),
                d.isActive()
        );
    }
}