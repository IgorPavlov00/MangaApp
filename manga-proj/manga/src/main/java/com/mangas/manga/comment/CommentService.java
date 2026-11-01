package com.mangas.manga.comment;

import com.mangas.manga.comment.CommentDtos.CommentPage;
import com.mangas.manga.comment.CommentDtos.CommentRequest;
import com.mangas.manga.comment.CommentDtos.CommentResponse;
import com.mangas.manga.common.NotFoundException;
import com.mangas.manga.library.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class CommentService {

    static final int PAGE_SIZE = 20;

    private final CommentRepository repository;

    public CommentService(CommentRepository repository) {
        this.repository = repository;
    }

    /** Newest first. {@code viewer} may be null for signed-out readers. */
    public CommentPage list(MediaType mediaType, int malId, int page, UUID viewer) {
        Page<Comment> result = repository.findByMediaTypeAndMalIdOrderByCreatedAtDesc(
                mediaType, malId, PageRequest.of(Math.max(page, 0), PAGE_SIZE));
        return new CommentPage(result.map(c -> CommentResponse.from(c, viewer)).getContent(),
                result.getNumber(), result.getTotalPages(), result.getTotalElements());
    }

    @Transactional
    public CommentResponse create(UUID userId, String authorName, MediaType mediaType, int malId, CommentRequest request) {
        Comment comment = new Comment(userId, mediaType, malId);
        apply(comment, authorName, request);
        return CommentResponse.from(repository.saveAndFlush(comment), userId);
    }

    @Transactional
    public CommentResponse update(UUID userId, String authorName, long id, CommentRequest request) {
        Comment comment = owned(userId, id);
        apply(comment, authorName, request);
        return CommentResponse.from(repository.saveAndFlush(comment), userId);
    }

    @Transactional
    public void delete(UUID userId, long id) {
        repository.delete(owned(userId, id));
    }

    /** Someone else's comment is reported as missing, so ids can't be probed for ownership. */
    private Comment owned(UUID userId, long id) {
        return repository.findById(id)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Comment " + id + " was not found"));
    }

    private static void apply(Comment comment, String authorName, CommentRequest request) {
        comment.setAuthorName(authorName.length() > 100 ? authorName.substring(0, 100) : authorName);
        comment.setBody(request.body().strip());
        comment.setSpoiler(request.isSpoiler());
    }
}
