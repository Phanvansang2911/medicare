package com.example.medicare.repository;

import com.example.medicare.entity.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpecialtyRepository extends JpaRepository<Specialty, Long> {
    boolean existsByName(String name);
    List<Specialty> findAllByActiveTrue();
}