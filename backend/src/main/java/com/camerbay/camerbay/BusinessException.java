package com.camerbay.camerbay;

import org.springframework.http.HttpStatus;

public class BusinessException extends AppException {

  public BusinessException(ErrorCode code, String message) {
    super(code, HttpStatus.BAD_REQUEST, message);
  }
}
