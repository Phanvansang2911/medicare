package com.example.medicare.security;

import com.example.medicare.entity.Doctor;
import com.example.medicare.entity.Patient;
import com.example.medicare.entity.User;
import com.example.medicare.exception.BusinessException;
import com.example.medicare.repository.DoctorRepository;
import com.example.medicare.repository.PatientRepository;
import com.example.medicare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Chưa đăng nhập");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "Không tìm thấy người dùng"));
    }

    public Patient getCurrentPatient() {
        User u = getCurrentUser();
        return patientRepository.findByUserId(u.getId())
                .orElseGet(() -> {
                    // Lazy create: user đăng ký role PATIENT nhưng chưa có Patient profile
                    Patient p = Patient.builder().user(u).build();
                    return patientRepository.save(p);
                });
    }

    public Doctor getCurrentDoctor() {
        User u = getCurrentUser();
        return doctorRepository.findByUserId(u.getId())
                .orElseThrow(() -> new BusinessException(HttpStatus.FORBIDDEN, "Tài khoản không phải bác sĩ"));
    }
}