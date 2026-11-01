package com.ecommerce.service;

import com.ecommerce.dto.CourierCalculateRequestDto;
import com.ecommerce.dto.CourierCalculateResponseDto;
import com.ecommerce.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;

/**
 * PickMe courier simulation. All pricing numbers below are PLACEHOLDERS (LKR);
 * replace them (or call the real PickMe API) when real rates are available.
 */
@Service
public class CourierService {

    // Colombo District bounding box
    private static final BigDecimal COLOMBO_MIN_LAT = new BigDecimal("6.80");
    private static final BigDecimal COLOMBO_MAX_LAT = new BigDecimal("6.99");
    private static final BigDecimal COLOMBO_MIN_LNG = new BigDecimal("79.80");
    private static final BigDecimal COLOMBO_MAX_LNG = new BigDecimal("80.00");

    // Simulated tariff: base fee covers the first 2 km and 2 kg
    private static final BigDecimal BASE_FEE = new BigDecimal("250.00");
    private static final BigDecimal INCLUDED_DISTANCE_KM = new BigDecimal("2.00");
    private static final BigDecimal FEE_PER_EXTRA_KM = new BigDecimal("50.00");
    private static final BigDecimal INCLUDED_WEIGHT_KG = new BigDecimal("2.000");
    private static final BigDecimal FEE_PER_EXTRA_KG = new BigDecimal("30.00");

    private static final double EARTH_RADIUS_KM = 6371.0088;

    private final double storeLatitude;
    private final double storeLongitude;

    // Central store location (defaults to Colombo Fort); override in application.properties:
    //   courier.store.latitude=...   courier.store.longitude=...
    public CourierService(@Value("${courier.store.latitude:6.9344}") double storeLatitude,
                          @Value("${courier.store.longitude:79.8428}") double storeLongitude) {
        this.storeLatitude = storeLatitude;
        this.storeLongitude = storeLongitude;
    }

    public CourierCalculateResponseDto validateAndCalculateFee(CourierCalculateRequestDto request) {
        if (request == null || request.getDeliveryLatitude() == null || request.getDeliveryLongitude() == null) {
            throw new BadRequestException("Delivery latitude and longitude are required");
        }
        BigDecimal lat = request.getDeliveryLatitude();
        BigDecimal lng = request.getDeliveryLongitude();
        if (lat.abs().compareTo(BigDecimal.valueOf(90)) > 0 || lng.abs().compareTo(BigDecimal.valueOf(180)) > 0) {
            throw new BadRequestException("Latitude or longitude is out of range");
        }
        BigDecimal weightKg = request.getTotalWeightKg() == null ? BigDecimal.ZERO : request.getTotalWeightKg();
        if (weightKg.signum() < 0) {
            throw new BadRequestException("Total weight cannot be negative");
        }

        boolean withinColombo = isWithinColombo(lat, lng);
        BigDecimal distanceKm = BigDecimal.valueOf(
                haversineKm(storeLatitude, storeLongitude, lat.doubleValue(), lng.doubleValue()))
                .setScale(2, RoundingMode.HALF_UP);

        if (!withinColombo) {
            return new CourierCalculateResponseDto(false, distanceKm, null,
                    "Delivery location is outside Colombo District. PickMe courier delivery is not available.");
        }

        BigDecimal fee = BASE_FEE
                .add(surcharge(distanceKm, INCLUDED_DISTANCE_KM, FEE_PER_EXTRA_KM))
                .add(surcharge(weightKg, INCLUDED_WEIGHT_KG, FEE_PER_EXTRA_KG))
                .setScale(2, RoundingMode.HALF_UP);

        String message = String.format(Locale.ROOT, "Estimated PickMe courier fee: LKR %s for %s km",
                fee.toPlainString(), distanceKm.toPlainString());
        return new CourierCalculateResponseDto(true, distanceKm, fee, message);
    }

    private static boolean isWithinColombo(BigDecimal lat, BigDecimal lng) {
        return lat.compareTo(COLOMBO_MIN_LAT) >= 0 && lat.compareTo(COLOMBO_MAX_LAT) <= 0
                && lng.compareTo(COLOMBO_MIN_LNG) >= 0 && lng.compareTo(COLOMBO_MAX_LNG) <= 0;
    }

    private static BigDecimal surcharge(BigDecimal value, BigDecimal included, BigDecimal ratePerUnit) {
        return value.subtract(included).max(BigDecimal.ZERO).multiply(ratePerUnit);
    }

    /** Straight-line (great-circle) distance in km. */
    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
