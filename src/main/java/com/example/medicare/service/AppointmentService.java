package com.example.medicare.service;

import com.example.medicare.config.BookingProperties;
import com.example.medicare.dto.*;
import com.example.medicare.entity.*;
import com.example.medicare.enums.AppointmentStatus;
import com.example.medicare.enums.NotificationType;
import com.example.medicare.enums.SlotStatus;
import com.example.medicare.exception.BusinessException;
import com.example.medicare.repository.*;
import com.example.medicare.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository apptRepo;
    private final SlotRepository slotRepo;
    private final AppointmentStatusHistoryRepository historyRepo;
    private final CurrentUserService currentUserService;
    private final BookingProperties props;
    private final NotificationService notifService;
    private final EmailService emailService;

    // ============ PATIENT ============

    @Transactional
    public AppointmentResponse book(AppointmentCreateRequest req) {
        Patient patient = currentUserService.getCurrentPatient();
        Slot slot = slotRepo.findByIdForUpdate(req.slotId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Không tìm thấy khung giờ"));

        validateBookingRules(patient, slot);

        // 1. Đổi slot -> BOOKED
        slot.setStatus(SlotStatus.BOOKED);
        slotRepo.save(slot);

        // 2. Tạo appointment
        Appointment appt = Appointment.builder()
                .slot(slot)
                .patient(patient)
                .doctor(slot.getDoctor())
                .status(AppointmentStatus.PENDING)
                .reason(req.reason())
                .bookedAt(Instant.now())
                .expiresAt(computeExpiry(slot))
                .build();

        appt = apptRepo.save(appt);
        saveHistory(appt, null, AppointmentStatus.PENDING, currentUserService.getCurrentUser(), "Đặt lịch");

        notifService.push(appt.getDoctor().getUser(), NotificationType.APPOINTMENT_BOOKED,
                "Có lịch hẹn mới",
                "Bệnh nhân " + patient.getUser().getFullName() + " đặt lịch " + slot.getSlotDate()
                        + " " + slot.getStartTime());

        return AppointmentResponse.from(appt);
    }

    public Page<AppointmentResponse> myAppointments(int page, int size) {
        Patient p = currentUserService.getCurrentPatient();
        return apptRepo.findByPatientIdOrderByBookedAtDesc(p.getId(), PageRequest.of(page, size))
                .map(AppointmentResponse::from);
    }

    @Transactional
    public AppointmentResponse cancelByPatient(Long id, CancelRequest req) {
        Appointment a = apptRepo.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Không tìm thấy lịch"));
        Patient p = currentUserService.getCurrentPatient();

        if (!a.getPatient().getId().equals(p.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Không có quyền hủy");
        }
        if (a.getStatus() != AppointmentStatus.PENDING && a.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BusinessException("Không thể hủy ở trạng thái này");
        }
        if (a.getStatus() == AppointmentStatus.CONFIRMED && !canModifyBeforeStart(a, props.getCancelMinHours())) {
            throw new BusinessException("Chỉ được hủy trước giờ khám " + props.getCancelMinHours() + " giờ");
        }

        transition(a, AppointmentStatus.CANCELLED, currentUserService.getCurrentUser(), "Bệnh nhân hủy: " + req.reason());
        a.setCancelReason(req.reason());
        a.setCancelledAt(Instant.now());
        releaseSlot(a.getSlot());
        apptRepo.save(a);

        return AppointmentResponse.from(a);
    }

    @Transactional
    public AppointmentResponse rescheduleByPatient(Long id, RescheduleRequest req) {
        Appointment a = apptRepo.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Không tìm thấy lịch"));
        Patient p = currentUserService.getCurrentPatient();

        // 1. Kiểm tra quyền
        if (!a.getPatient().getId().equals(p.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Không có quyền đổi lịch này");
        }
        // 2. Kiểm tra trạng thái
        if (a.getStatus() != AppointmentStatus.PENDING && a.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BusinessException("Không thể đổi lịch ở trạng thái này");
        }
        // 3. Kiểm tra thời gian (phải trước 2 tiếng)
        if (!canModifyBeforeStart(a, props.getCancelMinHours())) {
            throw new BusinessException("Chỉ được đổi lịch trước giờ khám ít nhất " + props.getCancelMinHours() + " giờ");
        }

        // 4. Lấy slot mới và kiểm tra (Dùng findByIdForUpdate để khóa slot, tránh 2 người đổi cùng lúc)
        Slot newSlot = slotRepo.findByIdForUpdate(req.newSlotId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Không tìm thấy khung giờ mới"));
        if (newSlot.getStatus() != SlotStatus.AVAILABLE) {
            throw new BusinessException(HttpStatus.CONFLICT, "Khung giờ mới đã được người khác đặt");
        }

        // 5. Nhả slot cũ, giữ slot mới
        Slot oldSlot = a.getSlot();
        oldSlot.setStatus(SlotStatus.AVAILABLE);
        slotRepo.save(oldSlot);

        newSlot.setStatus(SlotStatus.BOOKED);
        slotRepo.save(newSlot);

        // 6. Cập nhật appointment
        AppointmentStatus oldStatus = a.getStatus();
        a.setSlot(newSlot);
        a.setDoctor(newSlot.getDoctor());
        a.setExpiresAt(computeExpiry(newSlot));
        a.setConfirmedAt(null); // Reset thời gian xác nhận

        // Nếu lịch đã được xác nhận (CONFIRMED) mà đổi giờ, phải quay về PENDING để bác sĩ duyệt lại
        if (oldStatus == AppointmentStatus.CONFIRMED) {
            transition(a, AppointmentStatus.PENDING, currentUserService.getCurrentUser(),
                    "Bệnh nhân đổi lịch sang " + newSlot.getSlotDate() + " " + newSlot.getStartTime());
        } else {
            // Nếu đang chờ xác nhận (PENDING) thì vẫn giữ PENDING, chỉ cần lưu lại lịch sử thay đổi
            saveHistory(a, oldStatus, AppointmentStatus.PENDING, currentUserService.getCurrentUser(),
                    "Bệnh nhân đổi lịch sang " + newSlot.getSlotDate() + " " + newSlot.getStartTime());
        }

        apptRepo.save(a);

        return AppointmentResponse.from(a);
    } // <--- ĐÃ THÊM DẤU NGOẶC NHỌN BỊ THIẾU Ở ĐÂY

    // ============ DOCTOR ============

    public List<AppointmentResponse> doctorAppointmentsByDate(LocalDate date, AppointmentStatus status) {
        Doctor d = currentUserService.getCurrentDoctor();
        return apptRepo.findDoctorAppointmentsByDate(d.getId(), date, status)
                .stream().map(AppointmentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> adminGetAllAppointments(int page, int size) {
        return apptRepo.findAllForAdmin(PageRequest.of(page, size))
                .map(AppointmentResponse::from);
    }

    @Transactional
    public AppointmentResponse confirm(Long id) {
        Appointment a = requireDoctorOwns(id);
        requireStatus(a, AppointmentStatus.PENDING);

        transition(a, AppointmentStatus.CONFIRMED, currentUserService.getCurrentUser(), "Bác sĩ xác nhận");
        a.setConfirmedAt(Instant.now());
        apptRepo.save(a);

        notifService.push(a.getPatient().getUser(), NotificationType.APPOINTMENT_CONFIRMED,
                "Lịch hẹn đã được xác nhận",
                "Bác sĩ " + a.getDoctor().getUser().getFullName() + " đã xác nhận lịch khám của bạn.");

        String patientEmail = a.getPatient().getUser().getEmail();
        String subject = "MediCare - Lịch khám đã được xác nhận";
        String body = "Chào " + a.getPatient().getUser().getFullName() + ",\n\n" +
                "Bác sĩ " + a.getDoctor().getUser().getFullName() + " đã xác nhận lịch khám của bạn.\n" +
                "Thời gian: " + a.getSlot().getStartTime() + " - Ngày " + a.getSlot().getSlotDate() + ".\n\n" +
                "Vui lòng đến đúng giờ. Trân trọng!";
        emailService.sendEmail(patientEmail, subject, body);

        return AppointmentResponse.from(a);
    }

    @Transactional
    public AppointmentResponse reject(Long id, RejectRequest req) {
        Appointment a = requireDoctorOwns(id);
        requireStatus(a, AppointmentStatus.PENDING);

        transition(a, AppointmentStatus.REJECTED, currentUserService.getCurrentUser(), "Bác sĩ từ chối: " + req.reason());
        a.setRejectReason(req.reason());
        releaseSlot(a.getSlot());
        apptRepo.save(a);

        return AppointmentResponse.from(a);
    }

    @Transactional
    public AppointmentResponse checkIn(Long id) {
        Appointment a = requireDoctorOwns(id);
        requireStatus(a, AppointmentStatus.CONFIRMED);

        LocalDateTime slotTime = LocalDateTime.of(a.getSlot().getSlotDate(), a.getSlot().getStartTime());
        LocalDateTime now = LocalDateTime.now();

        if (now.toLocalDate().isBefore(slotTime.toLocalDate())) {
            throw new BusinessException("Chỉ được check-in trong ngày khám");
        }
        if (now.isBefore(slotTime.minusMinutes(props.getCheckinMinutesBefore()))) {
            throw new BusinessException("Chỉ được check-in từ " + props.getCheckinMinutesBefore() + " phút trước");
        }

        transition(a, AppointmentStatus.ARRIVED, currentUserService.getCurrentUser(), "Đã đến");
        a.setArrivedAt(Instant.now());
        apptRepo.save(a);

        return AppointmentResponse.from(a);
    }

    @Transactional
    public AppointmentResponse complete(Long id, CompleteRequest req) {
        Appointment a = requireDoctorOwns(id);
        requireStatus(a, AppointmentStatus.ARRIVED);

        transition(a, AppointmentStatus.COMPLETED, currentUserService.getCurrentUser(), "Hoàn thành");
        a.setDoctorNote(req.doctorNote());
        a.setCompletedAt(Instant.now());
        apptRepo.save(a);

        return AppointmentResponse.from(a);
    }
    @Transactional
    public AppointmentResponse noShow(Long id) {
        Appointment a = requireDoctorOwns(id);
        requireStatus(a, AppointmentStatus.CONFIRMED);

        LocalDateTime slotTime = LocalDateTime.of(a.getSlot().getSlotDate(), a.getSlot().getStartTime());

        // Ràng buộc: Phải sau giờ khám ít nhất X phút mới được đánh dấu vắng
        if (LocalDateTime.now().isBefore(slotTime.plusMinutes(props.getNoShowAfterMinutes()))) {
            throw new BusinessException("Chỉ được đánh dấu vắng mặt sau giờ khám "
                    + props.getNoShowAfterMinutes() + " phút");
        }

        transition(a, AppointmentStatus.NO_SHOW, currentUserService.getCurrentUser(), "Bệnh nhân vắng mặt");
        releaseSlot(a.getSlot());
        apptRepo.save(a);

        return AppointmentResponse.from(a);
    }

    // ============ SCHEDULED JOB ============

    @Scheduled(fixedDelay = 60000) // Chạy mỗi 1 phút (để dễ test)
    @Transactional
    public void expireOverdue() {
        List<Appointment> list = apptRepo.findByStatusAndExpiresAtBefore(AppointmentStatus.PENDING, Instant.now());
        for (Appointment a : list) {
            try {
                transition(a, AppointmentStatus.EXPIRED, null, "Hết hạn xác nhận");
                releaseSlot(a.getSlot());
                apptRepo.save(a);
                log.info(">>> Đã tự động hủy lịch hết hạn: ID {}", a.getId());
            } catch (Exception e) {
                log.warn("Lỗi expire appt {}: {}", a.getId(), e.getMessage());
            }
        }
    }

    // ============ HELPERS ============

    private void validateBookingRules(Patient patient, Slot slot) {
        if (!slot.getDoctor().isActive()) {
            throw new BusinessException("Bác sĩ hiện không nhận lịch");
        }
        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw new BusinessException(HttpStatus.CONFLICT, "Khung giờ đã được đặt");
        }
        LocalDateTime slotStart = LocalDateTime.of(slot.getSlotDate(), slot.getStartTime());

        if (LocalDateTime.now().plusHours(props.getMinAdvanceHours()).isAfter(slotStart)) {
            throw new BusinessException("Phải đặt trước ít nhất " + props.getMinAdvanceHours() + " giờ");
        }
        if (slot.getSlotDate().isAfter(LocalDate.now().plusDays(props.getMaxAdvanceDays()))) {
            throw new BusinessException("Chỉ được đặt trước tối đa " + props.getMaxAdvanceDays() + " ngày");
        }

        int count = apptRepo.countByPatientIdAndStatusIn(patient.getId(),
                List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED));
        if (count >= props.getMaxActiveAppointments()) {
            throw new BusinessException("Đã đạt giới hạn " + props.getMaxActiveAppointments() + " lịch");
        }

        List<Appointment> overlapping = apptRepo.findOverlappingForPatient(
                patient.getId(), slot.getSlotDate(), slot.getStartTime(), slot.getEndTime(), null);
        if (!overlapping.isEmpty()) {
            throw new BusinessException("Bạn đã có lịch khác trùng khung giờ này");
        }
    }

    private Instant computeExpiry(Slot slot) {
        LocalDateTime slotStart = LocalDateTime.of(slot.getSlotDate(), slot.getStartTime());
        LocalDateTime byTimeout = LocalDateTime.now().plusHours(props.getConfirmTimeoutHours());
        LocalDateTime byCutoff = slotStart.minusHours(props.getMinAdvanceHours());
        LocalDateTime chosen = byTimeout.isBefore(byCutoff) ? byTimeout : byCutoff;
        return chosen.atZone(ZoneId.systemDefault()).toInstant();
    }

    private boolean canModifyBeforeStart(Appointment a, int hoursBefore) {
        LocalDateTime slotStart = LocalDateTime.of(a.getSlot().getSlotDate(), a.getSlot().getStartTime());
        return LocalDateTime.now().plusHours(hoursBefore).isBefore(slotStart);
    }

    private Appointment requireDoctorOwns(Long id) {
        Appointment a = apptRepo.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Không tìm thấy lịch"));
        Doctor d = currentUserService.getCurrentDoctor();
        if (!a.getDoctor().getId().equals(d.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Không có quyền xử lý");
        }
        return a;
    }

    private void requireStatus(Appointment a, AppointmentStatus expected) {
        if (a.getStatus() != expected) {
            throw new BusinessException("Trạng thái không hợp lệ để thao tác này");
        }
    }

    private void transition(Appointment a, AppointmentStatus next, User by, String note) {
        if (!a.getStatus().canTransitionTo(next)) {
            throw new BusinessException("Không thể chuyển từ " + a.getStatus() + " sang " + next);
        }
        AppointmentStatus from = a.getStatus();
        a.setStatus(next);
        historyRepo.save(AppointmentStatusHistory.builder()
                .appointment(a).fromStatus(from).toStatus(next).changedBy(by).note(note).build());
    }

    private void releaseSlot(Slot slot) {
        if (slot != null) {
            slot.setStatus(SlotStatus.AVAILABLE);
            slotRepo.save(slot);
        }
    }

    private void saveHistory(Appointment a, AppointmentStatus from, AppointmentStatus to, User by, String note) {
        historyRepo.save(AppointmentStatusHistory.builder()
                .appointment(a)
                .fromStatus(from)
                .toStatus(to)
                .changedBy(by)
                .note(note)
                .build());
    }
}