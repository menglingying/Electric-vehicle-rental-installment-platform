package com.evlease.installment.common;

import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiError> handle(ApiException ex) {
    log.warn("ApiException: status={}, message={}", ex.getStatus(), ex.getMessage());
    return ResponseEntity.status(ex.getStatus()).body(new ApiError(ex.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handle(MethodArgumentNotValidException ex) {
    var message = ex.getBindingResult().getFieldErrors().stream()
      .findFirst()
      .map(err -> err.getField() + " " + err.getDefaultMessage())
      .orElse("Invalid request");
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(message));
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ApiError> handle(ConstraintViolationException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError("Invalid request"));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handle(Exception ex) {
    log.error("Unhandled exception", ex);
    ex.printStackTrace();
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiError("Server error"));
  }
}
