package com.example.medicare.controller;

import com.example.medicare.dto.AppointmentCreateRequest;
import com.example.medicare.dto.AppointmentResponse;
import com.example.medicare.dto.CancelRequest;
import com.example.medicare.service.AppointmentService;
import com.example.medicare.dto.RescheduleRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PATIENT')")
public class PatientAppointmentController {

    private final AppointmentService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse book(@Valid @RequestBody AppointmentCreateRequest req) {
        return service.book(req);
    }

    @GetMapping("/me")
    public Page<AppointmentResponse> myAppointments(@RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {
        return service.myAppointments(page, size);
    }

    @PatchMapping("/{id}/cancel")
    public AppointmentResponse cancel(@PathVariable Long id, @Valid @RequestBody CancelRequest req) {
        return service.cancelByPatient(id, req);
    }
    @PatchMapping("/{id}/reschedule")
    public AppointmentResponse reschedule(@PathVariable Long id, @Valid @RequestBody RescheduleRequest req) {
        return service.rescheduleByPatient(id, req);
    }
}