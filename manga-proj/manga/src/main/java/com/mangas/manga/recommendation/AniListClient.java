package com.mangas.manga.recommendation;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.mangas.manga.library.MediaType;
import com.mangas.manga.recommendation.JikanClient.Recommendation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Backup source for recommendations when Jikan is unavailable. AniList exposes MyAnimeList ids
 * (idMal), so results stay keyed the same way as the rest of the app.
 */
@Component
public class AniListClient {

    private static final Logger log = LoggerFactory.getLogger(AniListClient.class);
    private static final String QUERY = """
            query ($idMal: Int, $type: MediaType) {
              Media(idMal: $idMal, type: $type) {
                recommendations(sort: RATING_DESC, perPage: 25) {
                  nodes { rating mediaRecommendation { idMal title { romaji english } coverImage { extraLarge large } } }
                }
              }
            }""";

    private final RestClient http;

    public AniListClient(RestClient.Builder builder) {
        this.http = builder.baseUrl("https://graphql.anilist.co").build();
    }

    /** Community recommendations for a MAL title, best-rated first. Empty on failure. */
    public List<Recommendation> recommendationsFor(MediaType type, int malId) {
        try {
            Response response = http.post()
                    .header("Accept", "application/json")
                    .body(Map.of("query", QUERY, "variables", Map.of("idMal", malId, "type", type.name())))
                    .retrieve()
                    .body(Response.class);
            if (response == null || response.data() == null || response.data().media() == null) {
                return List.of();
            }
            return response.data().media().recommendations().nodes().stream()
                    .map(AniListClient::toRecommendation)
                    .filter(Objects::nonNull)
                    .toList();
        } catch (RestClientException ex) {
            log.warn("AniList recommendations for {} {} failed: {}", type, malId, ex.getMessage());
            return List.of();
        }
    }

    private static Recommendation toRecommendation(Node node) {
        MediaRecommendation m = node.mediaRecommendation();
        if (m == null || m.idMal() == null) {
            return null;
        }
        String title = m.title().english() != null ? m.title().english() : m.title().romaji();
        String image = m.coverImage() == null ? null
                : m.coverImage().extraLarge() != null ? m.coverImage().extraLarge() : m.coverImage().large();
        return new Recommendation(m.idMal(), title, image, Math.max(node.rating() == null ? 0 : node.rating(), 0));
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Response(Data data) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Data(@com.fasterxml.jackson.annotation.JsonProperty("Media") MediaNode media) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record MediaNode(Recommendations recommendations) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Recommendations(List<Node> nodes) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Node(Integer rating, MediaRecommendation mediaRecommendation) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record MediaRecommendation(Integer idMal, Title title, Cover coverImage) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Title(String romaji, String english) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Cover(String extraLarge, String large) {
    }
}
