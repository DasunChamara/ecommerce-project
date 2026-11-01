package com.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AuthResponseDto {

    private String token;
    private String message;
    private Integer userId;
    private String email;
    private String role;

    @JsonProperty("isBlacklisted")
    private boolean blacklisted;

    private Integer penaltyCount;

    public AuthResponseDto() {
    }

    public AuthResponseDto(String token, String message, Integer userId, String email,
                           String role, boolean blacklisted, Integer penaltyCount) {
        this.token = token;
        this.message = message;
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.blacklisted = blacklisted;
        this.penaltyCount = penaltyCount;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isBlacklisted() { return blacklisted; }
    public void setBlacklisted(boolean blacklisted) { this.blacklisted = blacklisted; }

    public Integer getPenaltyCount() { return penaltyCount; }
    public void setPenaltyCount(Integer penaltyCount) { this.penaltyCount = penaltyCount; }
}
