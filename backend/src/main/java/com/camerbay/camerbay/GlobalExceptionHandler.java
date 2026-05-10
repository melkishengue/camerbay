package com.camerbay.camerbay;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

        @Value("${app.devMode:false}")
        private boolean devMode;

        private static final String PROBLEM_BASE_TYPE = "https://api.camerbay.com/problems";

        @ExceptionHandler(MissingRequestHeaderException.class)
        public ResponseEntity<ProblemDetail> handleMissingHeader(
                        MissingRequestHeaderException ex,
                        WebRequest request) {
                log.error("Missing required header: {}", ex.getHeaderName());

                Map<String, Object> properties = buildDevModeProperties(ex);
                if (properties == null) {
                        properties = new HashMap<>();
                }
                properties.put("missingHeader", ex.getHeaderName());

                ProblemDetail problem = ProblemDetail.builder()
                                .type(PROBLEM_BASE_TYPE + "/missing-header")
                                .title("Missing Required Header")
                                .status(HttpStatus.UNAUTHORIZED.value())
                                .detail("Missing required authentication header: " + ex.getHeaderName())
                                .instance(getRequestUri(request))
                                .timestamp(LocalDateTime.now())
                                .properties(properties)
                                .build();

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ProblemDetail> handleValidationErrors(
                        MethodArgumentNotValidException ex,
                        WebRequest request) {
                log.error("Validation error: {}", ex.getMessage());

                Map<String, String> fieldErrors = new HashMap<>();
                ex.getBindingResult().getAllErrors().forEach(error -> {
                        String fieldName = ((FieldError) error).getField();
                        String errorMessage = error.getDefaultMessage();
                        fieldErrors.put(fieldName, errorMessage);
                });

                Map<String, Object> properties = buildDevModeProperties(ex);
                if (properties == null) {
                        properties = new HashMap<>();
                }
                properties.put("errors", fieldErrors);

                ProblemDetail problem = ProblemDetail.builder()
                                .type(PROBLEM_BASE_TYPE + "/validation-error")
                                .title("Validation Failed")
                                .status(HttpStatus.BAD_REQUEST.value())
                                .detail("Request validation failed for " + fieldErrors.size() + " field(s)")
                                .instance(getRequestUri(request))
                                .timestamp(LocalDateTime.now())
                                .properties(properties)
                                .build();

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
        }

        @ExceptionHandler(HandlerMethodValidationException.class)
        public ResponseEntity<ProblemDetail> handleValidationException(
                        HandlerMethodValidationException ex,
                        WebRequest request) {
                log.error("Validation error: {}", ex.getMessage());

                String message = ex.getAllErrors().stream()
                                .map(error -> error.getDefaultMessage())
                                .findFirst()
                                .orElse("Validation failed");

                ProblemDetail problem = ProblemDetail.builder()
                                .type(PROBLEM_BASE_TYPE + "/validation-error")
                                .title("Validation Failed")
                                .status(HttpStatus.BAD_REQUEST.value())
                                .detail(message)
                                .instance(getRequestUri(request))
                                .timestamp(LocalDateTime.now())
                                .properties(buildDevModeProperties(ex))
                                .build();

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ProblemDetail> handleGenericException(
                        Exception ex,
                        WebRequest request) {
                log.error("Unexpected error: ", ex);

                ProblemDetail problem = ProblemDetail.builder()
                                .type(PROBLEM_BASE_TYPE + "/internal-error")
                                .title("Internal Server Error")
                                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                                .detail("An unexpected error occurred")
                                .instance(getRequestUri(request))
                                .timestamp(LocalDateTime.now())
                                .properties(buildDevModeProperties(ex))
                                .build();

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
        }

        /**
         * Build additional properties for dev mode
         * In production, this returns null to exclude debug information
         */
        private Map<String, Object> buildDevModeProperties(Exception ex) {
                if (!devMode) {
                        return null;
                }

                Map<String, Object> properties = new HashMap<>();
                properties.put("exceptionClass", ex.getClass().getName());
                properties.put("exceptionMessage", ex.getMessage());
                properties.put("stackTrace", getStackTraceList(ex));

                if (ex.getCause() != null) {
                        Map<String, Object> causeInfo = new HashMap<>();
                        causeInfo.put("class", ex.getCause().getClass().getName());
                        causeInfo.put("message", ex.getCause().getMessage());
                        causeInfo.put("stackTrace", getStackTraceList(ex.getCause()));
                        properties.put("cause", causeInfo);
                }

                return properties;
        }

        /**
         * Convert stack trace to a list of strings for JSON serialization
         */
        private List<String> getStackTraceList(Throwable throwable) {
                return Arrays.stream(throwable.getStackTrace())
                                .limit(10) // Limit to first 10 frames to avoid huge responses
                                .map(StackTraceElement::toString)
                                .collect(Collectors.toList());
        }

        /**
         * Extract request URI from WebRequest
         */
        private String getRequestUri(WebRequest request) {
                return request.getDescription(false).replace("uri=", "");
        }
}