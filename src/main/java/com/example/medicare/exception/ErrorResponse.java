package com.example.medicare.exception;

import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

public record ErrorResponse(int status, String code, String message, LocalDateTime timestamp) {

    public static ErrorResponse of(HttpStatus s, String msg) {
        return new ErrorResponse(s.value(), s.name(), msg, LocalDateTime.now());
    }

    public static ErrorResponse of(HttpStatus s, String code, String msg) {
        return new ErrorResponse(s.value(), code, msg, LocalDateTime.now());
    }
}