package com.camerbay.camerbay.user;

import java.util.List;

import org.springframework.data.domain.Page;

public record ProviderListPaginatedResponse(
    List<ProviderPublicResponse> content,
    Long offset,
    int pageNumber,
    Boolean hasNext,
    Boolean hasPrevious,
    int pageSize) {

  static ProviderListPaginatedResponse fromPage(Page<User> page) {
    return new ProviderListPaginatedResponse(
        page.getContent().stream().map(ProviderPublicResponse::from).toList(),
        page.getPageable().getOffset(),
        page.getPageable().getPageNumber(),
        page.hasNext(),
        page.hasPrevious(),
        page.getPageable().getPageSize());
  }
}
