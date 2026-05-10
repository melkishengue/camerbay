package com.camerbay.camerbay.category;

import java.util.UUID;

public record CategoryResponse(
    UUID id,
    String title,
    CategoryEnum name,
    Boolean active) {

  public static CategoryResponse from(Category category) {
    return new CategoryResponse(
        category.getId(),
        category.getTitle(),
        category.getName(),
        category.getActive());
  }
}
