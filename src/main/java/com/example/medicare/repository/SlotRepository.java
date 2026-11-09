package com.example.medicare.repository;

import com.example.medicare.entity.Slot;
import com.example.medicare.enums.SlotStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SlotRepository extends JpaRepository<Slot, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Slot s WHERE s.id = :id")
    Optional<Slot> findByIdForUpdate(@Param("id") Long id);

    boolean existsByDoctorIdAndSlotDateAndStartTime(Long doctorId, LocalDate date, LocalTime startTime);

    List<Slot> findByDoctorIdAndSlotDateAndStatusOrderByStartTimeAsc(
            Long doctorId, LocalDate date, SlotStatus status);

    List<Slot> findByDoctorIdAndSlotDateOrderByStartTimeAsc(Long doctorId, LocalDate date);

    Optional<Slot> findByIdAndStatus(Long id, SlotStatus status);
}