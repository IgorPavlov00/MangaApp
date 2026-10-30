package com.mangas.manga.recommendation;

import com.mangas.manga.library.LibraryEntry;
import com.mangas.manga.library.LibraryEntryRepository;
import com.mangas.manga.library.LibraryStatus;
import com.mangas.manga.library.MediaType;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Builds "because you liked X" suggestions: takes the user's best-loved titles as seeds, pulls the
 * community recommendations for each from MyAnimeList, and ranks candidates by how strongly and how
 * often they are recommended, weighted by how much the user liked the seed.
 */
@Service
public class RecommendationService {

    static final int MAX_SEEDS = 5;
    private static final double UNRATED_SEED_WEIGHT = 0.6;

    private final LibraryEntryRepository library;
    private final JikanClient jikan;

    public RecommendationService(LibraryEntryRepository library, JikanClient jikan) {
        this.library = library;
        this.jikan = jikan;
    }

    public List<RecommendationResponse> recommend(UUID userId, MediaType type, int limit) {
        List<LibraryEntry> entries = library.findByUserIdAndMediaTypeOrderByUpdatedAtDesc(userId, type);
        Set<Integer> alreadyInLibrary = entries.stream().map(LibraryEntry::getMalId).collect(Collectors.toSet());

        List<LibraryEntry> seeds = entries.stream()
                .filter(e -> e.getStatus() != LibraryStatus.DROPPED)
                .filter(e -> e.getRating() == null || e.getRating() >= 6)
                .sorted(Comparator.comparingDouble(RecommendationService::seedWeight).reversed())
                .limit(MAX_SEEDS)
                .toList();

        Map<Integer, Candidate> candidates = new LinkedHashMap<>();
        for (LibraryEntry seed : seeds) {
            double weight = seedWeight(seed);
            for (JikanClient.Recommendation rec : jikan.recommendationsFor(type, seed.getMalId())) {
                if (alreadyInLibrary.contains(rec.malId())) {
                    continue;
                }
                candidates.computeIfAbsent(rec.malId(), id -> new Candidate(rec))
                        .add(weight * Math.log1p(rec.votes()), seed.getTitle());
            }
        }

        return candidates.values().stream()
                .sorted(Comparator.comparingDouble(Candidate::score).reversed())
                .limit(limit)
                .map(c -> new RecommendationResponse(type, c.rec.malId(), c.rec.title(), c.rec.imageUrl(),
                        Math.round(c.score * 100) / 100.0, List.copyOf(c.because)))
                .toList();
    }

    /** Favourites and high ratings count most; unrated titles still count a little. */
    static double seedWeight(LibraryEntry e) {
        double weight = e.getRating() == null ? UNRATED_SEED_WEIGHT : e.getRating() / 10.0;
        if (e.isFavorite()) {
            weight += 0.5;
        }
        return weight;
    }

    private static final class Candidate {
        private final JikanClient.Recommendation rec;
        private final Set<String> because = new LinkedHashSet<>();
        private double score;

        Candidate(JikanClient.Recommendation rec) {
            this.rec = rec;
        }

        void add(double points, String seedTitle) {
            score += points;
            because.add(seedTitle);
        }

        double score() {
            return score;
        }
    }

    public record RecommendationResponse(MediaType mediaType, int malId, String title, String imageUrl,
                                         double score, List<String> because) {
    }
}
