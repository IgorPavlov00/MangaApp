package com.mangas.manga.recommendation;

import com.mangas.manga.library.MediaType;
import com.mangas.manga.recommendation.JikanClient.Recommendation;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class AniListClientTest {

    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    private final AniListClient client = new AniListClient(builder);

    @Test
    void mapsRecommendationsByMalIdAndSkipsTitlesWithoutOne() {
        server.expect(requestTo("https://graphql.anilist.co"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"idMal\":2")))
                .andRespond(withSuccess("""
                        {"data":{"Media":{"recommendations":{"nodes":[
                          {"rating":120,"mediaRecommendation":{"idMal":656,"title":{"romaji":"Vagabond","english":null},
                            "coverImage":{"extraLarge":"xl.jpg","large":"l.jpg"}}},
                          {"rating":30,"mediaRecommendation":{"idMal":null,"title":{"romaji":"AniList only","english":null},
                            "coverImage":null}},
                          {"rating":-2,"mediaRecommendation":{"idMal":1,"title":{"romaji":"Monster","english":"Monster"},
                            "coverImage":{"extraLarge":null,"large":"m.jpg"}}}
                        ]}}}}
                        """, org.springframework.http.MediaType.APPLICATION_JSON));

        assertThat(client.recommendationsFor(MediaType.MANGA, 2)).containsExactly(
                new Recommendation(656, "Vagabond", "xl.jpg", 120),
                new Recommendation(1, "Monster", "m.jpg", 0));
    }

    @Test
    void returnsEmptyListWhenAniListFails() {
        server.expect(requestTo("https://graphql.anilist.co")).andRespond(withStatus(HttpStatus.BAD_GATEWAY));

        assertThat(client.recommendationsFor(MediaType.ANIME, 5)).isEmpty();
    }
}
