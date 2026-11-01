package com.ecommerce.service;

import java.util.Set;

/** Central place for business constants shared across services. */
public final class BusinessRules {

    private BusinessRules() {
    }

    public static final String ROLE_CUSTOMER = "CUSTOMER";
    public static final String PAYMENT_COD = "COD";

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_PROCESSING = "PROCESSING";
    public static final String STATUS_SHIPPED = "SHIPPED";
    public static final String STATUS_DELIVERED = "DELIVERED";
    public static final String STATUS_CANCELLED = "CANCELLED";
    public static final String STATUS_REJECTED = "REJECTED";

    /** Statuses an admin may set through updateOrderStatus. */
    public static final Set<String> ADMIN_SETTABLE_STATUSES =
            Set.of(STATUS_PENDING, STATUS_PROCESSING, STATUS_SHIPPED, STATUS_DELIVERED);

    /** A user is auto-blacklisted when penaltyCount EXCEEDS this value (i.e. on the 6th rejection). */
    public static final int MAX_PENALTY_POINTS = 5;

    public static final long CANCELLATION_WINDOW_HOURS = 48;
}
