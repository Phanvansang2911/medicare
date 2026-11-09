package com.example.medicare.dto;

import com.example.medicare.entity.Specialty;

public record SpecialtyResponse(Long id, String name, String description, boolean active) {
    public static SpecialtyResponse from(Specialty s) {
        return new SpecialtyResponse(s.getId(), s.getName(), s.getDescription(), s.isActive());
    }
}