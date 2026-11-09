package com.example.medicare.controller;

import com.example.medicare.dto.PatientResponse;
import com.example.medicare.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PATIENT')")
public class PatientController {

    private final CurrentUserService currentUserService;

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public PatientResponse me() {
        return PatientResponse.from(currentUserService.getCurrentPatient());
    }
}