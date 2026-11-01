package com.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class OrderResponseDto {

    private Integer orderId;
    private BigDecimal totalAmount;
    private BigDecimal itemsTotal;
    private BigDecimal courierFee;
    private BigDecimal totalWeightKg;

    @JsonProperty("isUrgent")
    private boolean urgent;

    private String status;
    private LocalDateTime createdAt;
    private String deliveryAddress;

    public OrderResponseDto() {
    }

    public OrderResponseDto(Integer orderId, BigDecimal totalAmount, BigDecimal itemsTotal,
                            BigDecimal courierFee, BigDecimal totalWeightKg, boolean urgent,
                            String status, LocalDateTime createdAt, String deliveryAddress) {
        this.orderId = orderId;
        this.totalAmount = totalAmount;
        this.itemsTotal = itemsTotal;
        this.courierFee = courierFee;
        this.totalWeightKg = totalWeightKg;
        this.urgent = urgent;
        this.status = status;
        this.createdAt = createdAt;
        this.deliveryAddress = deliveryAddress;
    }

    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public BigDecimal getItemsTotal() { return itemsTotal; }
    public void setItemsTotal(BigDecimal itemsTotal) { this.itemsTotal = itemsTotal; }

    public BigDecimal getCourierFee() { return courierFee; }
    public void setCourierFee(BigDecimal courierFee) { this.courierFee = courierFee; }

    public BigDecimal getTotalWeightKg() { return totalWeightKg; }
    public void setTotalWeightKg(BigDecimal totalWeightKg) { this.totalWeightKg = totalWeightKg; }

    public boolean isUrgent() { return urgent; }
    public void setUrgent(boolean urgent) { this.urgent = urgent; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
}
