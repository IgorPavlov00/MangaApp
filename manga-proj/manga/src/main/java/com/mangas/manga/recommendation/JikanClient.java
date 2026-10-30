package com.mangas.manga.recommendation;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mangas.manga.config.AppProperties;
import com.mangas.manga.library.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Objects;

/**
 * Minimal client for the public Jikan (MyAnimeList) API. Jikan allows about 3 requests per second,
 * so calls are spaced out and results cached for a few hours. When Jikan is down, AniList answers
 * instead, and Jikan is skipped for a few minutes so each request doesn't wait for a timeout.
 */
@Component
public class JikanClient {

    private static final Logger log = LoggerFactory.getLogger(JikanClient.class);
    private static final long MIN_INTERVAL_MS = 400;
    private static final long OUTAGE_BACKOFF_MS = 3 * 60 * 1000;

    private final RestClient http;
    private final AniListClient aniList;
    private long lastCallAt;
    private volatile long jikanDownUntil;

    public JikanClient(RestClient.Builder builder, AppProperties props, AniListClient aniList) {
        this.http = builder.baseUrl(props.jikan().baseUrl()).build();
        this.aniList = aniList;
    }

    /** Titles that MyAnimeList users recommend alongside the given one, most-voted first. Empty on failure. */
    @Cacheable(cacheNames = "jikan-recommendations", unless = "#result.isEmpty()")
    public List<Recommendation> recommendationsFor(MediaType type, int malId) {
        if (System.currentTimeMillis() < jikanDownUntil) {
            return aniList.recommendationsFor(type, malId);
        }
        for (int attempt = 0; attempt < 2; attempt++) {
            throttle();
            try {
                RecommendationsPage page = http.get()
                        .uri("/{type}/{id}/recommendations", type.path(), malId)
                        .retrieve()
                        .body(RecommendationsPage.class);
                if (page == null || page.data() == null) {
                    return List.of();
                }
                return page.data().stream()
                        .map(r -> r.entry() == null ? null : new Recommendation(
                                r.entry().malId(), r.entry().title(), r.entry().imageUrl(), r.votes() == null ? 0 : r.votes()))
                        .filter(Objects::nonNull)
                        .toList();
            } catch (HttpClientErrorException.TooManyRequests ex) {
                log.debug("Jikan rate limit hit for {} {}, retrying", type, malId);
                sleep(1000);
            } catch (ResourceAccessException | HttpServerErrorException ex) {
                log.warn("Jikan unavailable ({}), using AniList for the next few minutes", ex.getMessage());
                jikanDownUntil = System.currentTimeMillis() + OUTAGE_BACKOFF_MS;
                return aniList.recommendationsFor(type, malId);
            } catch (RestClientException ex) {
                log.warn("Jikan recommendations for {} {} failed: {}", type, malId, ex.getMessage());
                return aniList.recommendationsFor(type, malId);
            }
        }
        return aniList.recommendationsFor(type, malId);
    }

    private synchronized void throttle() {
        long wait = lastCallAt + MIN_INTERVAL_MS - System.currentTimeMillis();
        if (wait > 0) {
            sleep(wait);
        }
        lastCallAt = System.currentTimeMillis();
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }

    public record Recommendation(int malId, String title, String imageUrl, int votes) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record RecommendationsPage(List<Item> data) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Item(Entry entry, Integer votes) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Entry(@JsonProperty("mal_id") int malId, String title, Images images) {
        String imageUrl() {
            if (images == null) {
                return null;
            }
            if (images.webp() != null && images.webp().largeImageUrl() != null) {
                return images.webp().largeImageUrl();
            }
            return images.jpg() == null ? null : images.jpg().largeImageUrl();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Images(Image jpg, Image webp) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Image(@JsonProperty("large_image_url") String largeImageUrl) {
    }
}
