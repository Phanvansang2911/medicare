package com.example.medicare.dto;

import com.example.medicare.entity.Patient;

import java.time.LocalDate;

public record PatientResponse(
        Long id,
        Long userId,
        String fullName,
        String email,
        String phone,
        LocalDate dateOfBirth,
        String gender,
        String address,
        String medicalNote
) {
    public static PatientResponse from(Patient p) {
        return new PatientResponse(
                p.getId(),
                p.getUser().getId(),
                p.getUser().getFullName(),
                p.getUser().getEmail(),
                p.getUser().getPhone(),
                p.getDateOfBirth(),
                p.getGender() == null ? null : p.getGender().name(),
                p.getAddress(),
                p.getMedicalNote()
        );
    }
}