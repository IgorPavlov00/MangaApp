package com.mangas.manga.author;

import com.mangas.manga.manga.Manga;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "authors")
public class Author {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long malId;
    private String name;

    @ManyToMany(mappedBy = "authors")
    private List<Manga> mangaList;

    // Getters and setters
}