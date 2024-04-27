package com.mangas.manga.manga;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MangaRepository extends JpaRepository<Manga, Long> {
    @Query("SELECT m.id FROM Manga m JOIN m.users u WHERE u.id = :userId")
    List<Long> findMangaIdsByUserId(@Param("userId") Long userId);

    // You can add custom query methods here if needed
}

