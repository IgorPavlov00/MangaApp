package com.mangas.manga.comment;

import com.mangas.manga.comment.CommentDtos.CommentPage;
import com.mangas.manga.comment.CommentDtos.CommentRequest;
import com.mangas.manga.comment.CommentDtos.CommentResponse;
import com.mangas.manga.common.CurrentUser;
import com.mangas.manga.library.MediaType;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Comments on a title. Reading is public; writing requires a signed-in user. */
@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService service;

    public CommentController(CommentService service) {
        this.service = service;
    }

    @GetMapping("/{mediaType}/{malId}")
    public CommentPage list(@AuthenticationPrincipal Jwt jwt, @PathVariable MediaType mediaType, @PathVariable int malId,
                            @RequestParam(defaultValue = "0") int page) {
        return service.list(mediaType, malId, page, jwt == null ? null : CurrentUser.id(jwt));
    }

    @PostMapping("/{mediaType}/{malId}")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse create(@AuthenticationPrincipal Jwt jwt, @PathVariable MediaType mediaType, @PathVariable int malId,
                                  @Valid @RequestBody CommentRequest request) {
        return service.create(CurrentUser.id(jwt), CurrentUser.displayName(jwt), mediaType, malId, request);
    }

    @PutMapping("/{id}")
    public CommentResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable long id,
                                  @Valid @RequestBody CommentRequest request) {
        return service.update(CurrentUser.id(jwt), CurrentUser.displayName(jwt), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        service.delete(CurrentUser.id(jwt), id);
    }
}
