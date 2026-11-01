package com.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public class CourierCalculateResponseDto {

    @JsonProperty("isWithinColombo")
    private boolean withinColombo;

    private BigDecimal distanceKm;
    private BigDecimal estimatedCourierFee;
    private String message;

    public CourierCalculateResponseDto() {
    }

    public CourierCalculateResponseDto(boolean withinColombo, BigDecimal distanceKm,
                                       BigDecimal estimatedCourierFee, String message) {
        this.withinColombo = withinColombo;
        this.distanceKm = distanceKm;
        this.estimatedCourierFee = estimatedCourierFee;
        this.message = message;
    }

    public boolean isWithinColombo() { return withinColombo; }
    public void setWithinColombo(boolean withinColombo) { this.withinColombo = withinColombo; }

    public BigDecimal getDistanceKm() { return distanceKm; }
    public void setDistanceKm(BigDecimal distanceKm) { this.distanceKm = distanceKm; }

    public BigDecimal getEstimatedCourierFee() { return estimatedCourierFee; }
    public void setEstimatedCourierFee(BigDecimal estimatedCourierFee) { this.estimatedCourierFee = estimatedCourierFee; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
