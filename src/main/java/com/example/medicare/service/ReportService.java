package com.example.medicare.service;

import com.example.medicare.entity.Doctor;
import com.example.medicare.repository.AppointmentRepository;
import com.example.medicare.repository.DoctorRepository;
import com.example.medicare.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final AppointmentRepository apptRepo;
    private final DoctorRepository doctorRepo;
    private final CurrentUserService currentUserService;

    public Map<String, Object> adminSummary(LocalDate from, LocalDate to) {
        Map<String, Object> result = new HashMap<>();
        result.put("from", from.toString());
        result.put("to", to.toString());
        result.put("totalDoctors", doctorRepo.count());
        result.put("totalAppointments", apptRepo.count());
        // Bạn có thể viết thêm query đếm số lịch COMPLETED, CANCELLED... ở đây
        return result;
    }
}