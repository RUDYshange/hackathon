package za.co.royalsquare.crm.common;

import java.time.Instant;
import java.util.Map;

/**
 * A record is ideal here: an error response is immutable data with no behaviour.
 * No getters, constructor or equals to write by hand.
 */
public record ApiError(
        Instant timestamp,
        int status,
        String message,
        Map<String, String> fieldErrors
) {}
