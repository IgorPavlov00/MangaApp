package com.mangas.manga.auth;

import com.mangas.manga.manga.Manga;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@Builder
@ToString
public class AddMangaRequest {
    private Long userId;
    private Long mangaId;


    // Getters and setters
}
