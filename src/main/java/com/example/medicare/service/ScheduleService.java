package com.example.medicare.service;

import com.example.medicare.dto.ScheduleExceptionRequest;
import com.example.medicare.dto.ScheduleRequest;
import com.example.medicare.dto.ScheduleResponse;
import com.example.medicare.entity.Doctor;
import com.example.medicare.entity.DoctorSchedule;
import com.example.medicare.entity.ScheduleException;
import com.example.medicare.enums.ScheduleExceptionType;
import com.example.medicare.enums.SlotStatus;
import com.example.medicare.exception.BusinessException;
import com.example.medicare.repository.DoctorScheduleRepository;
import com.example.medicare.repository.ScheduleExceptionRepository;
import com.example.medicare.repository.SlotRepository; // <-- THÊM IMPORT NÀY
import com.example.medicare.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final DoctorScheduleRepository scheduleRepo;
    private final ScheduleExceptionRepository exceptionRepo;
    private final CurrentUserService currentUserService;
    private final SlotGenerationService slotGen;
    private final SlotRepository slotRepo; // <-- THÊM DÒNG NÀY ĐỂ INJECT REPOSITORY

    public List<ScheduleResponse> mySchedules() {
        Doctor d = currentUserService.getCurrentDoctor();
        return scheduleRepo.findByDoctorIdAndActiveTrue(d.getId())
                .stream().map(ScheduleResponse::from).toList();
    }

    @Transactional
    public ScheduleResponse add(ScheduleRequest req) {
        if (!req.startTime().isBefore(req.endTime())) {
            throw new BusinessException("Giờ bắt đầu phải trước giờ kết thúc");
        }
        Doctor d = currentUserService.getCurrentDoctor();
        DoctorSchedule s = DoctorSchedule.builder()
                .doctor(d)
                .dayOfWeek(req.dayOfWeek())
                .startTime(req.startTime())
                .endTime(req.endTime())
                .effectiveFrom(req.effectiveFrom())
                .effectiveTo(req.effectiveTo())
                .active(req.active() == null || req.active())
                .build();
        s = scheduleRepo.save(s);

        // Sinh slot ngay cho 14 ngày tới
        LocalDate today = LocalDate.now();
        slotGen.generateForDoctor(d, today, today.plusDays(14));
        return ScheduleResponse.from(s);
    }

    @Transactional
    public void delete(Long id) {
        DoctorSchedule s = scheduleRepo.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Không tìm thấy ca"));
        Doctor d = currentUserService.getCurrentDoctor();
        if (!s.getDoctor().getId().equals(d.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Không có quyền xóa ca này");
        }
        s.setActive(false);
        scheduleRepo.save(s);
    }

    @Transactional
    public void addException(ScheduleExceptionRequest req) {
        Doctor d = currentUserService.getCurrentDoctor();
        if (req.date().isBefore(LocalDate.now())) {
            throw new BusinessException("Chỉ có thể đăng ký nghỉ cho ngày trong tương lai");
        }
        if (req.type() == ScheduleExceptionType.EXTRA_SHIFT) {
            if (req.startTime() == null || req.endTime() == null
                    || !req.startTime().isBefore(req.endTime())) {
                throw new BusinessException("Ca phụ phải có giờ bắt đầu và kết thúc hợp lệ");
            }
        }
        ScheduleException e = ScheduleException.builder()
                .doctor(d)
                .date(req.date())
                .type(req.type())
                .startTime(req.startTime())
                .endTime(req.endTime())
                .reason(req.reason())
                .build();
        exceptionRepo.save(e);

        // Sinh lại slot cho ngày đó
        slotGen.generateForDoctor(d, req.date(), req.date());
    }

    @Transactional
    public ScheduleResponse update(Long id, ScheduleRequest req) {
        DoctorSchedule schedule = scheduleRepo.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Không tìm thấy ca làm việc"));

        Doctor currentDoctor = currentUserService.getCurrentDoctor();
        if (!schedule.getDoctor().getId().equals(currentDoctor.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Không có quyền sửa ca này");
        }

        // RÀNG BUỘC: Không cho sửa nếu đã có bệnh nhân đặt lịch ở ca này trong tương lai
        LocalDate today = LocalDate.now();
        boolean hasActiveAppointments = slotRepo.findAll().stream()
                .filter(s -> s.getDoctor().getId().equals(currentDoctor.getId()))
                .filter(s -> s.getSlotDate().isAfter(today) || s.getSlotDate().isEqual(today))
                .filter(s -> s.getSlotDate().getDayOfWeek().getValue() == schedule.getDayOfWeek())
                .filter(s -> !s.getStartTime().isBefore(schedule.getStartTime()) && !s.getStartTime().isAfter(schedule.getEndTime()))
                .anyMatch(s -> s.getStatus() == SlotStatus.BOOKED);

        if (hasActiveAppointments) {
            throw new BusinessException("Không thể sửa ca này vì đã có bệnh nhân đặt lịch. Vui lòng xử lý lịch hẹn trước.");
        }

        // 1. Xóa các slot AVAILABLE cũ của ca này
        slotRepo.findAll().stream()
                .filter(s -> s.getDoctor().getId().equals(currentDoctor.getId()))
                .filter(s -> s.getSlotDate().isAfter(today) || s.getSlotDate().isEqual(today))
                .filter(s -> s.getSlotDate().getDayOfWeek().getValue() == schedule.getDayOfWeek())
                .filter(s -> !s.getStartTime().isBefore(schedule.getStartTime()) && !s.getStartTime().isAfter(schedule.getEndTime()))
                .filter(s -> s.getStatus() == SlotStatus.AVAILABLE)
                .forEach(slotRepo::delete);

        // 2. Cập nhật thông tin ca
        schedule.setStartTime(req.startTime());
        schedule.setEndTime(req.endTime());
        schedule.setDayOfWeek(req.dayOfWeek());
        schedule.setEffectiveFrom(req.effectiveFrom());
        schedule.setEffectiveTo(req.effectiveTo());

        // SỬA Ở ĐÂY: Bỏ gán biến schedule
        scheduleRepo.save(schedule);

        // 3. Sinh lại slot mới cho 14 ngày tới
        slotGen.generateForDoctor(currentDoctor, today, today.plusDays(14));

        return ScheduleResponse.from(schedule);
    }
}