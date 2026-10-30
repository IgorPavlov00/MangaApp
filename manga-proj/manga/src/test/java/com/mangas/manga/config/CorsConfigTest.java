package com.mangas.manga.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CorsConfigTest {

    private final CorsConfiguration config = new SecurityConfig()
            .corsConfigurationSource(new AppProperties(null,
                    new AppProperties.Cors(List.of("https://animan*.onrender.com", "http://localhost:4200")), null))
            .getCorsConfiguration(new MockHttpServletRequest("GET", "/api/library"));

    @Test
    void allowsTheRenderStaticSiteIncludingGeneratedSuffixes() {
        assertThat(config.checkOrigin("https://animan.onrender.com")).isNotNull();
        assertThat(config.checkOrigin("https://animan-k3x9.onrender.com")).isNotNull();
        assertThat(config.checkOrigin("http://localhost:4200")).isNotNull();
    }

    @Test
    void rejectsOtherSites() {
        assertThat(config.checkOrigin("https://evil.onrender.com")).isNull();
        assertThat(config.checkOrigin("http://animan.onrender.com")).isNull();
        assertThat(config.checkOrigin("https://animan.onrender.com.evil.com")).isNull();
    }
}
