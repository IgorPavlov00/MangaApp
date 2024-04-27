package com.mangas.manga.manga;


import com.mangas.manga.author.Author;
import com.mangas.manga.characters.Character;
import com.mangas.manga.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Table(name = "mangas")
public class Manga {

    @Id
    private Long id;

    private Long malId;
    private String title;
    private String description;
    private double score;

    // Assuming one manga can have multiple images
    @ElementCollection
    private List<String> images;

    @OneToMany(mappedBy = "manga", cascade = CascadeType.ALL)
    private List<Character> characters;
    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    @ManyToMany(mappedBy = "mangaList",cascade = CascadeType.ALL)
    private List<User> users;
    @ManyToMany
    @JoinTable(name = "manga_author",
            joinColumns = @JoinColumn(name = "manga_id"),
            inverseJoinColumns = @JoinColumn(name = "author_id"))
    private List<Author> authors;



}
