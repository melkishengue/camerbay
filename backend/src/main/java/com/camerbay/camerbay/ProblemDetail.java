package com.camerbay.camerbay;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * RFC 7807 Problem Details for HTTP APIs
 * https://datatracker.ietf.org/doc/html/rfc7807
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProblemDetail {

  /**
   * A URI reference that identifies the problem type
   */
  private String type;

  /**
   * A short, human-readable summary of the problem type
   */
  private String title;

  /**
   * The HTTP status code
   */
  private Integer status;

  /**
   * A human-readable explanation specific to this occurrence of the problem
   */
  private String detail;

  /**
   * A URI reference that identifies the specific occurrence of the problem
   */
  private String instance;

  /**
   * Timestamp when the error occurred
   */
  private LocalDateTime timestamp;

  /**
   * Additional properties for validation errors, stack traces, etc.
   */
  private Map<String, Object> properties;
}