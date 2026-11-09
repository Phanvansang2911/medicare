package com.example.medicare.controller;

import com.example.medicare.dto.ScheduleExceptionRequest;
import com.example.medicare.dto.ScheduleRequest;
import com.example.medicare.dto.ScheduleResponse;
import com.example.medicare.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctor/schedules")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DOCTOR')")
public class DoctorScheduleController {

    private final ScheduleService service;

    @GetMapping
    public List<ScheduleResponse> mySchedules() {
        return service.mySchedules();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleResponse add(@Valid @RequestBody ScheduleRequest req) {
        return service.add(req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/exceptions")
    @ResponseStatus(HttpStatus.CREATED)
    public void addException(@Valid @RequestBody ScheduleExceptionRequest req) {
        service.addException(req);
    }
    @PutMapping("/{id}")
    public ScheduleResponse update(@PathVariable Long id, @Valid @RequestBody ScheduleRequest req) {
        return service.update(id, req);
    }
}