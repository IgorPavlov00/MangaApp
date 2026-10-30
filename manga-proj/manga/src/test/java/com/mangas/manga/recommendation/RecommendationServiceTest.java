package com.mangas.manga.recommendation;

import com.mangas.manga.library.LibraryEntry;
import com.mangas.manga.library.LibraryEntryRepository;
import com.mangas.manga.library.LibraryStatus;
import com.mangas.manga.library.MediaType;
import com.mangas.manga.recommendation.JikanClient.Recommendation;
import com.mangas.manga.recommendation.RecommendationService.RecommendationResponse;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RecommendationServiceTest {

    private static final UUID USER = UUID.randomUUID();

    private final LibraryEntryRepository library = mock(LibraryEntryRepository.class);
    private final JikanClient jikan = mock(JikanClient.class);
    private final RecommendationService service = new RecommendationService(library, jikan);

    private static LibraryEntry entry(int malId, String title, LibraryStatus status, Integer rating) {
        var e = new LibraryEntry(USER, MediaType.MANGA, malId);
        e.setTitle(title);
        e.setStatus(status);
        e.setRating(rating);
        return e;
    }

    @Test
    void ranksTitlesRecommendedBySeveralSeedsFirstAndSkipsOwnedOnes() {
        when(library.findByUserIdAndMediaTypeOrderByUpdatedAtDesc(USER, MediaType.MANGA)).thenReturn(List.of(
                entry(2, "Berserk", LibraryStatus.COMPLETED, 10),
                entry(13, "One Piece", LibraryStatus.IN_PROGRESS, 8)));
        when(jikan.recommendationsFor(MediaType.MANGA, 2)).thenReturn(List.of(
                new Recommendation(656, "Vagabond", null, 40),
                new Recommendation(13, "One Piece", null, 5),
                new Recommendation(1706, "JoJo", null, 10)));
        when(jikan.recommendationsFor(MediaType.MANGA, 13)).thenReturn(List.of(
                new Recommendation(1706, "JoJo", null, 30)));

        List<RecommendationResponse> result = service.recommend(USER, MediaType.MANGA, 10);

        assertThat(result).extracting(RecommendationResponse::malId).containsExactly(1706, 656);
        assertThat(result.get(0).because()).containsExactly("Berserk", "One Piece");
    }

    @Test
    void ignoresDroppedAndLowRatedTitlesAsSeeds() {
        when(library.findByUserIdAndMediaTypeOrderByUpdatedAtDesc(USER, MediaType.MANGA)).thenReturn(List.of(
                entry(1, "Dropped", LibraryStatus.DROPPED, 9),
                entry(2, "Disliked", LibraryStatus.COMPLETED, 3)));

        assertThat(service.recommend(USER, MediaType.MANGA, 10)).isEmpty();
        verify(jikan, never()).recommendationsFor(eq(MediaType.MANGA), anyInt());
    }

    @Test
    void usesAtMostFiveSeeds() {
        List<LibraryEntry> many = java.util.stream.IntStream.rangeClosed(1, 8)
                .mapToObj(i -> entry(i, "T" + i, LibraryStatus.COMPLETED, i == 8 ? 10 : 7))
                .toList();
        when(library.findByUserIdAndMediaTypeOrderByUpdatedAtDesc(USER, MediaType.MANGA)).thenReturn(many);
        when(jikan.recommendationsFor(eq(MediaType.MANGA), anyInt())).thenReturn(List.of());

        service.recommend(USER, MediaType.MANGA, 10);

        verify(jikan, org.mockito.Mockito.times(RecommendationService.MAX_SEEDS)).recommendationsFor(eq(MediaType.MANGA), anyInt());
        verify(jikan).recommendationsFor(MediaType.MANGA, 8); // the highest rated is always a seed
    }
}
