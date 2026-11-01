package com.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public class UserProfileResponseDto {

    private Integer id;
    private String email;
    private String phoneNumber;
    private String deliveryAddress;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer penaltyCount;

    @JsonProperty("isBlacklisted")
    private boolean blacklisted;

    public UserProfileResponseDto() {
    }

    public UserProfileResponseDto(Integer id, String email, String phoneNumber, String deliveryAddress,
                                  BigDecimal latitude, BigDecimal longitude,
                                  Integer penaltyCount, boolean blacklisted) {
        this.id = id;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.deliveryAddress = deliveryAddress;
        this.latitude = latitude;
        this.longitude = longitude;
        this.penaltyCount = penaltyCount;
        this.blacklisted = blacklisted;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public Integer getPenaltyCount() { return penaltyCount; }
    public void setPenaltyCount(Integer penaltyCount) { this.penaltyCount = penaltyCount; }

    public boolean isBlacklisted() { return blacklisted; }
    public void setBlacklisted(boolean blacklisted) { this.blacklisted = blacklisted; }
}
