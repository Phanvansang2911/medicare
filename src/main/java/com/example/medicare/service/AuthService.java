package com.example.medicare.service;

import com.example.medicare.dto.AuthResponse;
import com.example.medicare.dto.LoginRequest;
import com.example.medicare.dto.RegisterRequest;
import com.example.medicare.dto.UserResponse;
import com.example.medicare.entity.User;
import com.example.medicare.enums.Role;
import com.example.medicare.enums.UserStatus;
import com.example.medicare.exception.BusinessException;
import com.example.medicare.repository.UserRepository;
import com.example.medicare.security.JwtService;
import com.example.medicare.entity.Patient;
import com.example.medicare.enums.Gender;
import com.example.medicare.repository.PatientRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PatientRepository patientRepository;

    @Transactional
    public UserResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email đã được sử dụng");
        }
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(req.password()))
                .fullName(req.fullName().trim())
                .phone(req.phone())
                .role(Role.PATIENT)
                .status(UserStatus.ACTIVE)
                .build();
        user = userRepository.save(user); // Lưu trả về user có ID

        // Tự động tạo hồ sơ Patient
        Patient patient = Patient.builder()
                .user(user)
                .dateOfBirth(req.dateOfBirth())
                .gender(req.gender() != null ? Gender.valueOf(req.gender()) : null)
                .address(req.address())
                .build();
        patientRepository.save(patient);

        return UserResponse.from(user);
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, req.password()));
        } catch (LockedException | DisabledException e) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa");
        } catch (AuthenticationException e) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng");
        }
        User user = userRepository.findByEmail(email).orElseThrow();
        return new AuthResponse(jwtService.generateToken(user), "Bearer",
                jwtService.getExpirationSeconds(), UserResponse.from(user));
    }
}