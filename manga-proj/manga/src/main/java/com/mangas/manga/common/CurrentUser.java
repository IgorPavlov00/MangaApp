package com.mangas.manga.common;

import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Map;
import java.util.UUID;

/** Reads the Supabase user out of a verified access token. */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static UUID id(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    public static String email(Jwt jwt) {
        return jwt.getClaimAsString("email");
    }

    public static String displayName(Jwt jwt) {
        Map<String, Object> metadata = jwt.getClaimAsMap("user_metadata");
        if (metadata != null && metadata.get("display_name") instanceof String name && !name.isBlank()) {
            return name;
        }
        String email = email(jwt);
        return email == null || !email.contains("@") ? "Reader" : email.substring(0, email.indexOf('@'));
    }
}
