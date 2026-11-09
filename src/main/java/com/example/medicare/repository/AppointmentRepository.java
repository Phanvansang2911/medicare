package com.example.medicare.repository;

import com.example.medicare.entity.Appointment;
import com.example.medicare.enums.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    int countByPatientIdAndStatusIn(Long patientId, List<AppointmentStatus> statuses);

    // 1. Thêm @EntityGraph cho hàm lấy danh sách của Bệnh nhân
    @EntityGraph(attributePaths = {"slot", "doctor", "doctor.user", "doctor.specialty", "patient", "patient.user"})
    Page<Appointment> findByPatientIdOrderByBookedAtDesc(Long patientId, Pageable pageable);

    // 2. Thêm @EntityGraph cho hàm lấy danh sách của Bác sĩ (phân trang)
    @EntityGraph(attributePaths = {"slot", "doctor", "doctor.user", "doctor.specialty", "patient", "patient.user"})
    Page<Appointment> findByDoctorIdAndStatusOrderByBookedAtDesc(
            Long doctorId, AppointmentStatus status, Pageable pageable);

    List<Appointment> findByStatusAndExpiresAtBefore(AppointmentStatus status, Instant now);

    // 3.
    @EntityGraph(attributePaths = {"slot", "doctor", "doctor.user", "doctor.specialty", "patient", "patient.user"})
    @Query("SELECT a FROM Appointment a ORDER BY a.bookedAt DESC")
    Page<Appointment> findAllForAdmin(Pageable pageable);

    @Query("""
        SELECT a FROM Appointment a
        JOIN FETCH a.slot s
        WHERE a.patient.id = :patientId
          AND a.status IN ('PENDING','CONFIRMED','ARRIVED')
          AND s.slotDate = :date
          AND s.startTime < :endTime
          AND s.endTime > :startTime
          AND (:excludeId IS NULL OR a.id <> :excludeId)
    """)
    List<Appointment> findOverlappingForPatient(@Param("patientId") Long patientId,
                                                @Param("date") LocalDate date,
                                                @Param("startTime") LocalTime startTime,
                                                @Param("endTime") LocalTime endTime,
                                                @Param("excludeId") Long excludeId);

    // 3. ĐÃ THÊM ĐẦY ĐỦ JOIN FETCH CHO BÁC SĨ VÀ BỆNH NHÂN
    @Query("""
        SELECT a FROM Appointment a
        JOIN FETCH a.slot s
        JOIN FETCH a.patient p
        JOIN FETCH p.user pu
        JOIN FETCH a.doctor d
        JOIN FETCH d.user du
        JOIN FETCH d.specialty ds
        WHERE a.doctor.id = :doctorId
          AND s.slotDate = :date
          AND (:status IS NULL OR a.status = :status)
        ORDER BY s.startTime
    """)
    List<Appointment> findDoctorAppointmentsByDate(@Param("doctorId") Long doctorId,
                                                   @Param("date") LocalDate date,
                                                   @Param("status") AppointmentStatus status);
}