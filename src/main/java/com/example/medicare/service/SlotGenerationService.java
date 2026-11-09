package com.example.medicare.service;

import com.example.medicare.config.BookingProperties;
import com.example.medicare.entity.Doctor;
import com.example.medicare.entity.DoctorSchedule;
import com.example.medicare.entity.ScheduleException;
import com.example.medicare.entity.Slot;
import com.example.medicare.enums.ScheduleExceptionType;
import com.example.medicare.enums.SlotStatus;
import com.example.medicare.repository.DoctorRepository;
import com.example.medicare.repository.DoctorScheduleRepository;
import com.example.medicare.repository.ScheduleExceptionRepository;
import com.example.medicare.repository.SlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlotGenerationService {

    private final DoctorRepository doctorRepo;
    private final DoctorScheduleRepository scheduleRepo;
    private final ScheduleExceptionRepository exceptionRepo;
    private final SlotRepository slotRepo;
    private final BookingProperties props;

    /** Job chạy mỗi ngày 0h05 để sinh slot cho 14 ngày tới. */
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void generateDaily() {
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(props.getMaxAdvanceDays());
        generateRange(from, to);
    }

    @Transactional
    public int generateRange(LocalDate from, LocalDate to) {
        int total = 0;
        List<Doctor> doctors = doctorRepo.findAll().stream()
                .filter(Doctor::isActive).toList();
        for (Doctor d : doctors) {
            total += generateForDoctor(d, from, to);
        }
        log.info(">>> Sinh slot: {} slot từ {} đến {}", total, from, to);
        return total;
    }

    @Transactional
    public int generateForDoctor(Doctor doctor, LocalDate from, LocalDate to) {
        int created = 0;
        List<DoctorSchedule> schedules = scheduleRepo.findByDoctorIdAndActiveTrue(doctor.getId());
        List<ScheduleException> exceptions = exceptionRepo
                .findByDoctorIdAndDateBetween(doctor.getId(), from, to);

        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            LocalDate currentDate = date;
            short dow = (short) currentDate.getDayOfWeek().getValue();

            // Ngày nghỉ đột xuất?
            boolean isDayOff = exceptions.stream()
                    .anyMatch(e -> e.getDate().equals(currentDate)
                            && e.getType() == ScheduleExceptionType.DAY_OFF);

            if (isDayOff) {
                // Xóa slot AVAILABLE chưa đặt của ngày đó
                slotRepo.findByDoctorIdAndSlotDateOrderByStartTimeAsc(doctor.getId(), currentDate).stream()
                        .filter(s -> s.getStatus() == SlotStatus.AVAILABLE)
                        .forEach(slotRepo::delete);
                continue;
            }

            // Ca theo thứ trong tuần
            List<DoctorSchedule> schedulesOfDay = schedules.stream()
                    .filter(s -> s.getDayOfWeek() == dow)
                    .filter(s -> !currentDate.isBefore(s.getEffectiveFrom()))
                    .filter(s -> s.getEffectiveTo() == null || !currentDate.isAfter(s.getEffectiveTo()))
                    .toList();

            for (DoctorSchedule s : schedulesOfDay) {
                created += createSlotsFor(doctor, currentDate, s.getStartTime(), s.getEndTime());
            }

            // Ca phụ (EXTRA_SHIFT)
            exceptions.stream()
                    .filter(e -> e.getDate().equals(currentDate))
                    .filter(e -> e.getType() == ScheduleExceptionType.EXTRA_SHIFT)
                    .filter(e -> e.getStartTime() != null && e.getEndTime() != null)
                    .forEach(e -> createSlotsFor(doctor, currentDate, e.getStartTime(), e.getEndTime()));
        }
        return created;
    }

    private int createSlotsFor(Doctor doctor, LocalDate date, LocalTime start, LocalTime end) {
        int minutes = props.getSlotMinutes();
        int created = 0;
        LocalTime t = start;
        while (!t.plusMinutes(minutes).isAfter(end)) {
            LocalTime slotStart = t;
            LocalTime slotEnd = t.plusMinutes(minutes);
            if (!slotRepo.existsByDoctorIdAndSlotDateAndStartTime(doctor.getId(), date, slotStart)) {
                Slot slot = Slot.builder()
                        .doctor(doctor)
                        .slotDate(date)
                        .startTime(slotStart)
                        .endTime(slotEnd)
                        .status(SlotStatus.AVAILABLE)
                        .build();
                slotRepo.save(slot);
                created++;
            }
            t = slotEnd;
        }
        return created;
    }
}