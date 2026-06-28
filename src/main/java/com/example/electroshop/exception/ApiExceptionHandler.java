package com.example.electroshop.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(
            ResponseStatusException exception
    ) {
        HttpStatusCode statusCode = exception.getStatusCode();

        Map<String, Object> body = new LinkedHashMap<>();

        body.put("status", statusCode.value());
        body.put(
                "message",
                exception.getReason() == null
                        ? "Yêu cầu không hợp lệ"
                        : exception.getReason()
        );

        return ResponseEntity
                .status(statusCode)
                .body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(
            DataIntegrityViolationException exception
    ) {
        Map<String, Object> body = new LinkedHashMap<>();

        body.put("status", 409);
        body.put(
                "message",
                "Không thể thực hiện thao tác vì dữ liệu đang được sử dụng hoặc bị trùng"
        );

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleOtherException(
            Exception exception
    ) {
        exception.printStackTrace();

        Map<String, Object> body = new LinkedHashMap<>();

        body.put("status", 500);
        body.put(
                "message",
                "Lỗi hệ thống. Vui lòng thử lại sau."
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(body);
    }
}