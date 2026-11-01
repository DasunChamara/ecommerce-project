package com.ecommerce.dto;

import java.math.BigDecimal;

public class RegisterRequestDto {

    private String email;
    private String password;
    private String phoneNumber;
    private String deliveryAddress;
    private BigDecimal latitude;
    private BigDecimal longitude;

    public RegisterRequestDto() {
    }

    public RegisterRequestDto(String email, String password, String phoneNumber,
                              String deliveryAddress, BigDecimal latitude, BigDecimal longitude) {
        this.email = email;
        this.password = password;
        this.phoneNumber = phoneNumber;
        this.deliveryAddress = deliveryAddress;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
}
