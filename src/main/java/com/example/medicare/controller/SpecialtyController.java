package com.example.medicare.controller;

import com.example.medicare.dto.SpecialtyResponse;
import com.example.medicare.service.SpecialtyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/specialties")
@RequiredArgsConstructor
public class SpecialtyController {

    private final SpecialtyService service;

    @GetMapping
    public List<SpecialtyResponse> list() {
        return service.listAll();
    }

    @GetMapping("/{id}")
    public SpecialtyResponse get(@PathVariable Long id) {
        return service.get(id);
    }
}