package com.camerbay.camerbay.user;

import java.util.List;

public record UserPortfolioResponse(
        List<String> images) {
    static UserPortfolioResponse fromList(List<String> photos) {
        return new UserPortfolioResponse(photos);
    }
}
