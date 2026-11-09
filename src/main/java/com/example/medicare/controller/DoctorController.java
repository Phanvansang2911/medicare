package com.example.medicare.controller;

import com.example.medicare.dto.DoctorResponse;
import com.example.medicare.dto.SlotResponse;
import com.example.medicare.enums.SlotStatus;
import com.example.medicare.repository.SlotRepository;
import com.example.medicare.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import com.example.medicare.dto.DoctorUpdateRequest;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;
    private final SlotRepository slotRepo;

    @GetMapping("/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public DoctorResponse getMyProfile() {
        return doctorService.getMyProfile();
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public DoctorResponse updateMyProfile(@RequestBody DoctorUpdateRequest req) {
        return doctorService.updateMyProfile(req);
    }

    @GetMapping
    public List<DoctorResponse> search(@RequestParam(required = false) Long specialtyId,
                                       @RequestParam(required = false) String keyword) {
        return doctorService.search(specialtyId, keyword);
    }

    @GetMapping("/{id}")
    public DoctorResponse get(@PathVariable Long id) {
        return doctorService.get(id);
    }

    @GetMapping("/{id}/slots")
    public List<SlotResponse> slots(@PathVariable Long id,
                                    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        // Trả về TẤT CẢ các slot trong ngày (bao gồm cả BOOKED và BLOCKED)
        return slotRepo.findByDoctorIdAndSlotDateOrderByStartTimeAsc(id, date)
                .stream().map(SlotResponse::from).toList();
    }
}