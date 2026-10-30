package com.mangas.manga.library;

import java.util.Locale;

public enum MediaType {
    MANGA,
    ANIME;

    public static MediaType fromPath(String value) {
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown media type '" + value + "', expected 'manga' or 'anime'");
        }
    }

    /** Path segment used by the Jikan API, e.g. /manga/{id}. */
    public String path() {
        return name().toLowerCase(Locale.ROOT);
    }
}
