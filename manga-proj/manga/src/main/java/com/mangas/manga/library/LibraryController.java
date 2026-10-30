package com.mangas.manga.library;

import com.mangas.manga.common.CurrentUser;
import com.mangas.manga.library.LibraryDtos.EntryResponse;
import com.mangas.manga.library.LibraryDtos.SaveEntryRequest;
import com.mangas.manga.library.LibraryDtos.StatsResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** The signed-in user's library. Every query is scoped to the user id from the access token. */
@RestController
@RequestMapping("/api/library")
public class LibraryController {

    private final LibraryService service;

    public LibraryController(LibraryService service) {
        this.service = service;
    }

    @GetMapping
    public List<EntryResponse> list(@AuthenticationPrincipal Jwt jwt,
                                    @RequestParam(required = false) MediaType mediaType,
                                    @RequestParam(required = false) LibraryStatus status) {
        return service.list(CurrentUser.id(jwt), mediaType, status);
    }

    @GetMapping("/stats")
    public StatsResponse stats(@AuthenticationPrincipal Jwt jwt) {
        return service.stats(CurrentUser.id(jwt));
    }

    @GetMapping("/{mediaType}/{malId}")
    public EntryResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable MediaType mediaType, @PathVariable int malId) {
        return service.get(CurrentUser.id(jwt), mediaType, malId);
    }

    @PutMapping("/{mediaType}/{malId}")
    public EntryResponse save(@AuthenticationPrincipal Jwt jwt, @PathVariable MediaType mediaType, @PathVariable int malId,
                              @Valid @RequestBody SaveEntryRequest request) {
        return service.save(CurrentUser.id(jwt), mediaType, malId, request);
    }

    @DeleteMapping("/{mediaType}/{malId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable MediaType mediaType, @PathVariable int malId) {
        service.delete(CurrentUser.id(jwt), mediaType, malId);
    }
}
