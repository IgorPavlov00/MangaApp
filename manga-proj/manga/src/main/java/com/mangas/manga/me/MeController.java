package com.mangas.manga.me;

import com.mangas.manga.common.CurrentUser;
import com.mangas.manga.library.LibraryDtos.StatsResponse;
import com.mangas.manga.library.LibraryService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final LibraryService library;

    public MeController(LibraryService library) {
        this.library = library;
    }

    @GetMapping
    public MeResponse me(@AuthenticationPrincipal Jwt jwt) {
        UUID id = CurrentUser.id(jwt);
        return new MeResponse(id, CurrentUser.email(jwt), CurrentUser.displayName(jwt), library.stats(id));
    }

    public record MeResponse(UUID id, String email, String displayName, StatsResponse stats) {
    }
}
