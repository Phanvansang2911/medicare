package com.example.medicare.controller;

import com.example.medicare.dto.AppointmentResponse;
import com.example.medicare.dto.CompleteRequest;
import com.example.medicare.dto.RejectRequest;
import com.example.medicare.enums.AppointmentStatus;
import com.example.medicare.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/doctor/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DOCTOR')")
public class DoctorAppointmentController {

    private final AppointmentService service;

    @GetMapping
    public List<AppointmentResponse> byDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) AppointmentStatus status) {
        return service.doctorAppointmentsByDate(date, status);
    }

    @PatchMapping("/{id}/confirm")
    public AppointmentResponse confirm(@PathVariable Long id) {
        return service.confirm(id);
    }

    @PatchMapping("/{id}/reject")
    public AppointmentResponse reject(@PathVariable Long id, @Valid @RequestBody RejectRequest req) {
        return service.reject(id, req);
    }

    @PatchMapping("/{id}/check-in")
    public AppointmentResponse checkIn(@PathVariable Long id) {
        return service.checkIn(id);
    }

    @PatchMapping("/{id}/complete")
    public AppointmentResponse complete(@PathVariable Long id, @Valid @RequestBody CompleteRequest req) {
        return service.complete(id, req);
    }
    @PatchMapping("/{id}/no-show")
    public AppointmentResponse noShow(@PathVariable Long id) {
        return service.noShow(id);
    }
}