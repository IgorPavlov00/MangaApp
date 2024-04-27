package com.mangas.manga.characters;

import com.mangas.manga.manga.Manga;
import jakarta.persistence.*;
import lombok.*;


@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "characters")
public class Character {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long malId;
    private String name;
    private String role;

    @ManyToOne
    private Manga manga;

    // Getters and setters
}

