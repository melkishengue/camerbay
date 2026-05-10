package com.camerbay.camerbay.offer;

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
public class PostalCode {

  @Column(name = "postal_code", nullable = false, length = 5)
  private String value;

  public static PostalCode of(String PostalCode) {
    if (PostalCode == null || PostalCode.isBlank()) {
      throw new IllegalArgumentException("PLZ cannot be empty");
    }

    String cleaned = PostalCode.trim();
    if (!cleaned.matches("^\\d{5}$")) {
      throw new IllegalArgumentException("PLZ must be exactly 5 digits");
    }

    return new PostalCode(cleaned);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    PostalCode code = (PostalCode) o;
    return Objects.equals(value, code.value);
  }

  @Override
  public int hashCode() {
    return Objects.hash(value);
  }
}