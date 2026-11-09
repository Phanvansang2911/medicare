package com.example.medicare.controller;

import com.example.medicare.dto.AppointmentResponse;
import com.example.medicare.service.AppointmentService;
import com.example.medicare.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final AppointmentService appointmentService; // Tiêm AppointmentService

    @GetMapping("/admin/reports/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportService.adminSummary(from, to);
    }

    // API Lấy tất cả lịch khám cho Admin
    @GetMapping("/admin/appointments")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<AppointmentResponse> getAllAppointments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return appointmentService.adminGetAllAppointments(page, size);
    }
}