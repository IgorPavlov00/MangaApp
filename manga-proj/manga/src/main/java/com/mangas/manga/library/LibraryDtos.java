package com.mangas.manga.library;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Map;

public final class LibraryDtos {

    private LibraryDtos() {
    }

    /** Body of PUT /api/library/{mediaType}/{malId}; creates the entry or replaces its fields. */
    public record SaveEntryRequest(
            @NotBlank @Size(max = 500) String title,
            @Size(max = 1000) String imageUrl,
            @NotNull LibraryStatus status,
            @Min(1) @Max(10) Integer rating,
            @Min(0) @Max(100_000) Integer progress,
            Boolean favorite) {

        public boolean isFavorite() {
            return Boolean.TRUE.equals(favorite);
        }
    }

    public record EntryResponse(
            MediaType mediaType,
            int malId,
            String title,
            String imageUrl,
            LibraryStatus status,
            Integer rating,
            Integer progress,
            boolean favorite,
            Instant createdAt,
            Instant updatedAt) {

        static EntryResponse from(LibraryEntry e) {
            return new EntryResponse(e.getMediaType(), e.getMalId(), e.getTitle(), e.getImageUrl(), e.getStatus(),
                    e.getRating(), e.getProgress(), e.isFavorite(), e.getCreatedAt(), e.getUpdatedAt());
        }
    }

    /** Counts per status for one media type, plus the user's mean rating. */
    public record MediaStats(long total, Map<LibraryStatus, Long> byStatus, Double averageRating) {
    }

    public record StatsResponse(MediaStats manga, MediaStats anime) {
    }
}
