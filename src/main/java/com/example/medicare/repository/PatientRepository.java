package com.example.medicare.repository;

import com.example.medicare.entity.Patient;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    @EntityGraph(attributePaths = {"user"})
    Optional<Patient> findByUserId(Long userId);
}