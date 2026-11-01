package com.ecommerce.controller;

import com.ecommerce.dto.ProductResponseDto;
import com.ecommerce.dto.ProductVariantResponseDto;
import com.ecommerce.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<ProductResponseDto>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/special")
    public ResponseEntity<List<ProductResponseDto>> getSpecialProducts() {
        return ResponseEntity.ok(productService.getSpecialProducts());
    }

    @GetMapping("/{id}/variants")
    public ResponseEntity<List<ProductVariantResponseDto>> getProductVariants(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(productService.getProductVariants(id));
    }
}
