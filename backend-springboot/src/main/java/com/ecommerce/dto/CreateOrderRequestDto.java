package com.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CreateOrderRequestDto {

    private Integer userId;
    private List<OrderItemRequestDto> items = new ArrayList<>();

    @JsonProperty("isUrgent")
    @JsonAlias("urgent")
    private boolean urgent;

    private String deliveryAddress;
    private BigDecimal deliveryLatitude;
    private BigDecimal deliveryLongitude;

    public CreateOrderRequestDto() {
    }

    public CreateOrderRequestDto(Integer userId, List<OrderItemRequestDto> items, boolean urgent,
                                 String deliveryAddress, BigDecimal deliveryLatitude,
                                 BigDecimal deliveryLongitude) {
        this.userId = userId;
        this.items = items;
        this.urgent = urgent;
        this.deliveryAddress = deliveryAddress;
        this.deliveryLatitude = deliveryLatitude;
        this.deliveryLongitude = deliveryLongitude;
    }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public List<OrderItemRequestDto> getItems() { return items; }
    public void setItems(List<OrderItemRequestDto> items) { this.items = items; }

    public boolean isUrgent() { return urgent; }
    public void setUrgent(boolean urgent) { this.urgent = urgent; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public BigDecimal getDeliveryLatitude() { return deliveryLatitude; }
    public void setDeliveryLatitude(BigDecimal deliveryLatitude) { this.deliveryLatitude = deliveryLatitude; }

    public BigDecimal getDeliveryLongitude() { return deliveryLongitude; }
    public void setDeliveryLongitude(BigDecimal deliveryLongitude) { this.deliveryLongitude = deliveryLongitude; }
}
