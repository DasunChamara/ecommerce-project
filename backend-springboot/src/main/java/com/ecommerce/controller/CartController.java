package com.ecommerce.controller;

import com.ecommerce.dto.AddToCartRequestDto;
import com.ecommerce.dto.CartItemResponseDto;
import com.ecommerce.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "http://localhost:3000")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping("/{userId}/add")
    public ResponseEntity<CartItemResponseDto> addToCart(@PathVariable("userId") Integer userId,
                                                         @RequestBody AddToCartRequestDto request) {
        return ResponseEntity.ok(cartService.addToCart(userId, request));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<CartItemResponseDto>> getCart(@PathVariable("userId") Integer userId) {
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    /** Toggle an item for Selective Checkout: PUT /api/cart/item/{id}/select?isSelected=true */
    @PutMapping("/item/{cartItemId}/select")
    public ResponseEntity<CartItemResponseDto> updateSelection(@PathVariable("cartItemId") Integer cartItemId,
                                                               @RequestParam("isSelected") boolean isSelected) {
        return ResponseEntity.ok(cartService.updateSelection(cartItemId, isSelected));
    }

    @DeleteMapping("/item/{cartItemId}")
    public ResponseEntity<Void> removeFromCart(@PathVariable("cartItemId") Integer cartItemId) {
        cartService.removeFromCart(cartItemId);
        return ResponseEntity.noContent().build();
    }
}
