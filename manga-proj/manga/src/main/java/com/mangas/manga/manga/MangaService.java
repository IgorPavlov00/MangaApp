package com.mangas.manga.manga;


import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class MangaService {

    private final MangaRepository mangaRepository;

    @Autowired
    public MangaService(MangaRepository mangaRepository) {
        this.mangaRepository = mangaRepository;
    }

    public List<Manga> getAllMangas() {
        return mangaRepository.findAll();
    }

    public Manga getMangaById(Long id) {
        Optional<Manga> optionalManga = mangaRepository.findById(id);
        return optionalManga.orElse(null);
    }

    public Manga saveManga(Manga manga) {
        return mangaRepository.save(manga);
    }

    public List<Long> findMangaIdsByUserId(Long userId) {
        return mangaRepository.findMangaIdsByUserId(userId);
    }
}
