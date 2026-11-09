package com.example.medicare.repository;

import com.example.medicare.entity.Doctor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    @EntityGraph(attributePaths = {"user", "specialty"})
    Optional<Doctor> findByUserId(Long userId);

    @Query("""
        SELECT d FROM Doctor d
        JOIN FETCH d.user u
        JOIN FETCH d.specialty s
        WHERE d.active = true
          AND (:specialtyId IS NULL OR s.id = :specialtyId)
          AND (:keyword IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY u.fullName
    """)
    List<Doctor> search(@Param("specialtyId") Long specialtyId,
                        @Param("keyword") String keyword);
}