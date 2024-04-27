package com.mangas.manga.auth;


import com.mangas.manga.manga.Manga;
import com.mangas.manga.manga.MangaService;
import com.mangas.manga.user.User;
import com.mangas.manga.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthenticationController {
    private final AuthenticationService service;
    @Autowired
    private UserService userService;

    private final MangaService mangaService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ResponseEntity<?> register(@RequestBody @Valid RegistrationRequest request) {
        service.register(request);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/user")
    public User getLoggedInUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        // Assuming your UserDetails implements your own User class, adjust accordingly if needed
        User user = (User) authentication.getPrincipal();

        return user;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody @Valid AuthenticationRequest request) {


        return ResponseEntity.ok(service.authenticate(request));
    }

    @GetMapping("/activate")
    public ResponseEntity<String> activateUser(@RequestParam("token") String token) {
        try {
            service.activateUser(token);
            return ResponseEntity.ok("User account activated successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/{userId}")
    public User getUserById(@PathVariable Long userId) {
        return userService.getUserById(userId);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<Optional<User>> getUserByEmail(@PathVariable String email) {
        Optional<User> user = userService.getUserByEmail(email);
        System.out.println(user);
        if (user.isPresent()) {
            return ResponseEntity.ok(user);
        } else {
            System.out.println("ne postoji");
            return ResponseEntity.notFound().build();

        }
    }
    @PostMapping("/add/manga")
    public ResponseEntity<?> addMangaToUser(@RequestBody AddMangaRequest request) {
        Long userId = request.getUserId();
        Long mangaId = request.getMangaId();

        // Print statement to check if the method is being hit
        System.out.println("addMangaToUser method called. User ID: " + userId + ", Manga ID: " + mangaId);

        // Find the user with the provided ID
        User user = userService.getUserById(userId);


            // Create a manga object with the provided manga ID
            Manga manga = new Manga();
            manga.setId(mangaId); // Assuming you set the manga ID like this
            System.out.println(manga);
            mangaService.saveManga(manga);
            // Set other manga properties if needed

            // Add manga to the user's list of manga
            user.getMangaList().add(manga);

            // Save the updated user
            userService.saveUser(user);

            return ResponseEntity.ok().build();
        }

    // Assuming you have a UserMangaRepository

    @GetMapping("/user/{userId}/manga-ids")
    public ResponseEntity<List<Long>> getUserMangaIds(@PathVariable Long userId) {
        List<Long> mangaIds = mangaService.findMangaIdsByUserId(userId);
        return ResponseEntity.ok(mangaIds);
    }
    }





