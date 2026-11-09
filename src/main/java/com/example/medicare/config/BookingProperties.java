package com.example.medicare.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "medicare.booking")
@Getter @Setter
public class BookingProperties {
    private int slotMinutes = 30;
    private int maxAdvanceDays = 14;
    private int minAdvanceHours = 2;
    private int maxActiveAppointments = 3;
    private int confirmTimeoutHours = 24;
    private int cancelMinHours = 2;
    private int checkinMinutesBefore = 30;
    private int noShowAfterMinutes = 15;
}