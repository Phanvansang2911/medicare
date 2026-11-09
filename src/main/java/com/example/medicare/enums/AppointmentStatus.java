package com.example.medicare.enums;

import java.util.Map;
import java.util.Set;

public enum AppointmentStatus {
    PENDING, CONFIRMED, ARRIVED, COMPLETED,
    REJECTED, CANCELLED, NO_SHOW, EXPIRED;

    // Định nghĩa các trạng thái được phép chuyển sang
    private static final Map<AppointmentStatus, Set<AppointmentStatus>> ALLOWED = Map.of(
            PENDING,   Set.of(CONFIRMED, REJECTED, CANCELLED, EXPIRED),
            CONFIRMED, Set.of(ARRIVED, CANCELLED, NO_SHOW),
            ARRIVED,   Set.of(COMPLETED, NO_SHOW),
            COMPLETED, Set.of(),
            REJECTED,  Set.of(),
            CANCELLED, Set.of(),
            NO_SHOW,   Set.of(),
            EXPIRED,   Set.of()
    );

    public boolean canTransitionTo(AppointmentStatus next) {
        return ALLOWED.get(this).contains(next);
    }
}