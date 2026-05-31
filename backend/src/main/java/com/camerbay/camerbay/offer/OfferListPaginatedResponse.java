package com.camerbay.camerbay.offer;

import java.util.List;

import org.springframework.data.domain.Page;

public record OfferListPaginatedResponse(
    List<OfferResponse> content, Long offset, int pageNumber, Boolean hasNext, Boolean hasPrevious, int pageSize) {

  public static OfferListPaginatedResponse fromPage(Page<Offer> page) {
    return new OfferListPaginatedResponse(page.getContent().stream().map(OfferResponse::from).toList(),
        page.getPageable().getOffset(),
        page.getPageable().getPageNumber(),
        page.hasNext(),
        page.hasPrevious(),
        page.getPageable().getPageSize());
  }
}
