package com.example.medicare.service;

import com.example.medicare.dto.DoctorCreateRequest;
import com.example.medicare.dto.DoctorResponse;
import com.example.medicare.entity.Doctor;
import com.example.medicare.entity.Specialty;
import com.example.medicare.entity.User;
import com.example.medicare.enums.Role;
import com.example.medicare.enums.UserStatus;
import com.example.medicare.exception.BusinessException;
import com.example.medicare.repository.DoctorRepository;
import com.example.medicare.repository.SpecialtyRepository;
import com.example.medicare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.medicare.dto.DoctorUpdateRequest;
import com.example.medicare.security.CurrentUserService;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepo;
    private final UserRepository userRepo;
    private final SpecialtyRepository specialtyRepo;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;

    public List<DoctorResponse> search(Long specialtyId, String keyword) {
        return doctorRepo.search(specialtyId, keyword).stream().map(DoctorResponse::from).toList();
    }

    public DoctorResponse get(Long id) {
        Doctor d = doctorRepo.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Không tìm thấy bác sĩ"));
        return DoctorResponse.from(d);
    }

    @Transactional
    public DoctorResponse create(DoctorCreateRequest req) {
        if (userRepo.existsByEmail(req.email().trim().toLowerCase())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email đã được sử dụng");
        }
        Specialty specialty = specialtyRepo.findById(req.specialtyId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Không tìm thấy chuyên khoa"));

        User user = userRepo.save(User.builder()
                .email(req.email().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(req.password()))
                .fullName(req.fullName().trim())
                .phone(req.phone())
                .role(Role.DOCTOR)
                .status(UserStatus.ACTIVE)
                .build());

        Doctor doctor = Doctor.builder()
                .user(user)
                .specialty(specialty)
                .degree(req.degree())
                .description(req.description())
                .active(true)
                .build();
        return DoctorResponse.from(doctorRepo.save(doctor));
    }

    @Transactional
    public DoctorResponse toggleActive(Long id) {
        Doctor d = doctorRepo.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Không tìm thấy bác sĩ"));
        d.setActive(!d.isActive());
        return DoctorResponse.from(doctorRepo.save(d));
    }
    public DoctorResponse getMyProfile() {
        Doctor d = currentUserService.getCurrentDoctor();
        return DoctorResponse.from(d);
    }

    @Transactional
    public DoctorResponse updateMyProfile(DoctorUpdateRequest req) {
        Doctor d = currentUserService.getCurrentDoctor();

        // Cập nhật thông tin User
        d.getUser().setFullName(req.fullName());
        d.getUser().setPhone(req.phone());
        userRepo.save(d.getUser());

        // Cập nhật thông tin Doctor
        d.setDegree(req.degree());
        d.setDescription(req.description());

        return DoctorResponse.from(doctorRepo.save(d));
    }
}