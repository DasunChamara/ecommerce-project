package com.ecommerce.controller;

import com.ecommerce.dto.CourierCalculateRequestDto;
import com.ecommerce.dto.CourierCalculateResponseDto;
import com.ecommerce.service.CourierService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/courier")
@CrossOrigin(origins = "http://localhost:3000")
public class CourierController {

    private final CourierService courierService;

    public CourierController(CourierService courierService) {
        this.courierService = courierService;
    }

    /** Validates the Colombo District location and returns the simulated PickMe fee. */
    @PostMapping("/calculate-fee")
    public ResponseEntity<CourierCalculateResponseDto> calculateFee(@RequestBody CourierCalculateRequestDto request) {
        return ResponseEntity.ok(courierService.validateAndCalculateFee(request));
    }
}
