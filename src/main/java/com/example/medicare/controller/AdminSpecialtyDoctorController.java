package com.example.medicare.controller;

import com.example.medicare.dto.*;
import com.example.medicare.service.DoctorService;
import com.example.medicare.service.SpecialtyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSpecialtyDoctorController {

    private final SpecialtyService specialtyService;
    private final DoctorService doctorService;

    // === Chuyên khoa ===
    @PostMapping("/specialties")
    @ResponseStatus(HttpStatus.CREATED)
    public SpecialtyResponse createSpecialty(@Valid @RequestBody SpecialtyRequest req) {
        return specialtyService.create(req);
    }

    @PutMapping("/specialties/{id}")
    public SpecialtyResponse updateSpecialty(@PathVariable Long id,
                                             @Valid @RequestBody SpecialtyRequest req) {
        return specialtyService.update(id, req);
    }

    @DeleteMapping("/specialties/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSpecialty(@PathVariable Long id) {
        specialtyService.delete(id);
    }

    // === Bác sĩ ===
    @PostMapping("/doctors")
    @ResponseStatus(HttpStatus.CREATED)
    public DoctorResponse createDoctor(@Valid @RequestBody DoctorCreateRequest req) {
        return doctorService.create(req);
    }

    @PatchMapping("/doctors/{id}/toggle")
    public DoctorResponse toggleDoctor(@PathVariable Long id) {
        return doctorService.toggleActive(id);
    }
}