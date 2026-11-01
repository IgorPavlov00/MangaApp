package com.mangas.manga.comment;

import com.mangas.manga.library.MediaType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class CommentDtos {

    private CommentDtos() {
    }

    public static final int MAX_LENGTH = 4000;

    /** Body of POST /api/comments/{mediaType}/{malId} and PUT /api/comments/{id}. */
    public record CommentRequest(@NotBlank @Size(max = MAX_LENGTH) String body, Boolean spoiler) {

        public boolean isSpoiler() {
            return Boolean.TRUE.equals(spoiler);
        }
    }

    /** {@code mine} is true when the caller wrote the comment (false for anonymous readers). */
    public record CommentResponse(
            long id,
            MediaType mediaType,
            int malId,
            String authorName,
            String body,
            boolean spoiler,
            boolean mine,
            boolean edited,
            Instant createdAt,
            Instant updatedAt) {

        static CommentResponse from(Comment c, UUID viewer) {
            return new CommentResponse(c.getId(), c.getMediaType(), c.getMalId(), c.getAuthorName(), c.getBody(),
                    c.isSpoiler(), c.getUserId().equals(viewer), c.getUpdatedAt().isAfter(c.getCreatedAt().plusSeconds(1)),
                    c.getCreatedAt(), c.getUpdatedAt());
        }
    }

    public record CommentPage(List<CommentResponse> items, int page, int totalPages, long total) {
    }
}
