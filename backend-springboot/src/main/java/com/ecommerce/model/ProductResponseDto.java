package com.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public class ProductResponseDto {

    private Integer id;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private Integer stockQuantity;
    private String imageUrl;

    @JsonProperty("isSpecial")
    private boolean special;

    public ProductResponseDto() {
    }

    public ProductResponseDto(Integer id, String name, String description, BigDecimal basePrice,
                              Integer stockQuantity, String imageUrl, boolean special) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.basePrice = basePrice;
        this.stockQuantity = stockQuantity;
        this.imageUrl = imageUrl;
        this.special = special;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public boolean isSpecial() { return special; }
    public void setSpecial(boolean special) { this.special = special; }
}
