//package com.mangas.manga.images;
//
//import com.mangas.manga.manga.Manga;
//import jakarta.persistence.*;
//import lombok.*;
//
//@Entity
//@Getter
//@Setter
//@Builder
//@AllArgsConstructor
//@NoArgsConstructor
//@Table(name = "images")
//public class Image {
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    private String imageUrl;
//    private String smallImageUrl;
//    private String largeImageUrl;
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "manga_id")
//    private Manga manga;
//    // Constructors, getters, and setters...
//}
