package com.example.medicare.repository;

import com.example.medicare.entity.ScheduleException;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleExceptionRepository extends JpaRepository<ScheduleException, Long> {
    List<ScheduleException> findByDoctorIdAndDateBetween(Long doctorId, LocalDate from, LocalDate to);
    List<ScheduleException> findByDateBetween(LocalDate from, LocalDate to);
}