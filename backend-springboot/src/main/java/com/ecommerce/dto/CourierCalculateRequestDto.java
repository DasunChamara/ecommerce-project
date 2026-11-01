package com.ecommerce.dto;

import java.math.BigDecimal;

public class CourierCalculateRequestDto {

    private BigDecimal deliveryLatitude;
    private BigDecimal deliveryLongitude;
    private BigDecimal totalWeightKg;

    public CourierCalculateRequestDto() {
    }

    public CourierCalculateRequestDto(BigDecimal deliveryLatitude, BigDecimal deliveryLongitude,
                                      BigDecimal totalWeightKg) {
        this.deliveryLatitude = deliveryLatitude;
        this.deliveryLongitude = deliveryLongitude;
        this.totalWeightKg = totalWeightKg;
    }

    public BigDecimal getDeliveryLatitude() { return deliveryLatitude; }
    public void setDeliveryLatitude(BigDecimal deliveryLatitude) { this.deliveryLatitude = deliveryLatitude; }

    public BigDecimal getDeliveryLongitude() { return deliveryLongitude; }
    public void setDeliveryLongitude(BigDecimal deliveryLongitude) { this.deliveryLongitude = deliveryLongitude; }

    public BigDecimal getTotalWeightKg() { return totalWeightKg; }
    public void setTotalWeightKg(BigDecimal totalWeightKg) { this.totalWeightKg = totalWeightKg; }
}
