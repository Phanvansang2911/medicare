package com.example.medicare.config;

import com.example.medicare.entity.Doctor;
import com.example.medicare.entity.Specialty;
import com.example.medicare.entity.User;
import com.example.medicare.enums.Role;
import com.example.medicare.enums.UserStatus;
import com.example.medicare.repository.DoctorRepository;
import com.example.medicare.repository.SpecialtyRepository;
import com.example.medicare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final SpecialtyRepository specialtyRepo;
    private final DoctorRepository doctorRepo;
    private final PasswordEncoder encoder;

    @Override
    public void run(String... args) {
        seedAdmin();
        seedSpecialtiesAndDoctors();
    }

    private void seedAdmin() {
        String email = "admin@medicare.local";
        if (userRepo.existsByEmail(email)) return;
        userRepo.save(User.builder()
                .email(email)
                .passwordHash(encoder.encode("admin12345"))
                .fullName("Administrator")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .build());
        log.info(">>> Đã tạo admin: {} / admin12345", email);
    }

    private void seedSpecialtiesAndDoctors() {
        if (specialtyRepo.count() > 0) return;

        Specialty nhi = specialtyRepo.save(Specialty.builder()
                .name("Nhi").description("Khám và điều trị cho trẻ em").build());
        Specialty tmh = specialtyRepo.save(Specialty.builder()
                .name("Tai Mũi Họng").description("Khám Tai - Mũi - Họng").build());
        Specialty dalieu = specialtyRepo.save(Specialty.builder()
                .name("Da liễu").description("Khám và điều trị bệnh về da").build());

        createDoctor("bs.nhi@medicare.local", "Bác sĩ Nguyễn Văn A", nhi, "ThS.BS");
        createDoctor("bs.tmh@medicare.local", "Bác sĩ Trần Thị B", tmh, "BS.CK1");
        createDoctor("bs.da@medicare.local", "Bác sĩ Lê Văn C", dalieu, "TS.BS");

        log.info(">>> Đã seed 3 chuyên khoa + 3 bác sĩ (password: doctor12345)");
    }

    private void createDoctor(String email, String fullName, Specialty specialty, String degree) {
        if (userRepo.existsByEmail(email)) return;
        User u = userRepo.save(User.builder()
                .email(email)
                .passwordHash(encoder.encode("doctor12345"))
                .fullName(fullName)
                .role(Role.DOCTOR)
                .status(UserStatus.ACTIVE)
                .build());
        doctorRepo.save(Doctor.builder()
                .user(u)
                .specialty(specialty)
                .degree(degree)
                .description("Bác sĩ chuyên khoa " + specialty.getName())
                .active(true)
                .build());
    }
}