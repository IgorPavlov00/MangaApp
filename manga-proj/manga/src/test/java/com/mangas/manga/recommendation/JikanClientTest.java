package com.mangas.manga.recommendation;

import com.mangas.manga.config.AppProperties;
import com.mangas.manga.library.MediaType;
import com.mangas.manga.recommendation.JikanClient.Recommendation;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class JikanClientTest {

    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    private final AniListClient aniList = mock(AniListClient.class);
    private final JikanClient client = new JikanClient(builder,
            new AppProperties(null, null, new AppProperties.Jikan("https://api.jikan.moe/v4")), aniList);

    @Test
    void mapsJikanRecommendations() {
        server.expect(requestTo("https://api.jikan.moe/v4/manga/2/recommendations")).andRespond(withSuccess("""
                {"data":[{"entry":{"mal_id":656,"title":"Vagabond","images":{"webp":{"large_image_url":"v.webp"}}},"votes":40}]}
                """, org.springframework.http.MediaType.APPLICATION_JSON));

        assertThat(client.recommendationsFor(MediaType.MANGA, 2))
                .containsExactly(new Recommendation(656, "Vagabond", "v.webp", 40));
        verifyNoInteractions(aniList);
    }

    @Test
    void fallsBackToAniListAndSkipsJikanWhileItIsDown() {
        List<Recommendation> fromAniList = List.of(new Recommendation(1, "Monster", null, 12));
        when(aniList.recommendationsFor(MediaType.MANGA, 2)).thenReturn(fromAniList);
        when(aniList.recommendationsFor(MediaType.MANGA, 3)).thenReturn(fromAniList);
        server.expect(requestTo("https://api.jikan.moe/v4/manga/2/recommendations"))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));

        assertThat(client.recommendationsFor(MediaType.MANGA, 2)).isEqualTo(fromAniList);
        // No second Jikan request is expected: the outage is remembered.
        assertThat(client.recommendationsFor(MediaType.MANGA, 3)).isEqualTo(fromAniList);

        server.verify();
        verify(aniList).recommendationsFor(MediaType.MANGA, 3);
    }
}
