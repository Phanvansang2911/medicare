package com.example.medicare.repository;

import com.example.medicare.entity.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {
    List<DoctorSchedule> findByDoctorIdAndActiveTrue(Long doctorId);
    List<DoctorSchedule> findByActiveTrue();
}