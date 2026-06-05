package com.camerbay.camerbay.user;

import com.camerbay.camerbay.BusinessException;
import com.camerbay.camerbay.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Objects;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class PhoneNumber {

  @Column(name = "phone", nullable = true, length = 20)
  private String value;

  public static PhoneNumber of(String phone) {
    if (phone == null || phone.isBlank()) {
      throw new BusinessException(ErrorCode.PHONE_INVALID, "Phone number cannot be empty");
    }

    String cleaned = phone.trim();
    if (!cleaned.startsWith("+")) {
      throw new BusinessException(ErrorCode.PHONE_INVALID,
          "Phone number must be in E.164 format (start with +)");
    }

    return new PhoneNumber(cleaned);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    PhoneNumber that = (PhoneNumber) o;
    return Objects.equals(value, that.value);
  }

  @Override
  public int hashCode() {
    return Objects.hash(value);
  }
}