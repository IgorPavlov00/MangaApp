package com.mangas.manga.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties("app")
public record AppProperties(Supabase supabase, Cors cors, Jikan jikan) {

    /**
     * @param url             project URL, e.g. https://abcd.supabase.co
     * @param legacyJwtSecret only set for projects still signing tokens with the legacy HS256 secret
     */
    public record Supabase(String url, String legacyJwtSecret) {
        public String issuer() {
            return url + "/auth/v1";
        }
    }

    public record Cors(List<String> allowedOrigins) {
    }

    public record Jikan(String baseUrl) {
    }
}
