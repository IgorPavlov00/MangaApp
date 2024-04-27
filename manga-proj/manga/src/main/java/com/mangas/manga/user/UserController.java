package com.mangas.manga.user;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.mangas.manga.user.User;
import com.mangas.manga.user.UserService;
import com.mangas.manga.manga.Manga;
import com.mangas.manga.manga.MangaService;
import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final MangaService mangaService;

    public UserController(UserService userService, MangaService mangaService) {
        this.userService = userService;
        this.mangaService = mangaService;
    }



    @PostMapping("/add/{userId}/mangas/{mangaId}")
    public ResponseEntity<?> addMangaToUser(@PathVariable Long userId, @PathVariable Long mangaId) {
        User user = userService.getUserById(userId);
        Manga manga = mangaService.getMangaById(mangaId);
        if (user != null && manga != null) {
            user.getMangaList().add(manga);
            userService.saveUser(user);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
