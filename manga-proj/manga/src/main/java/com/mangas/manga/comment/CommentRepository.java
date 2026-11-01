package com.mangas.manga.comment;

import com.mangas.manga.library.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    Page<Comment> findByMediaTypeAndMalIdOrderByCreatedAtDesc(MediaType mediaType, Integer malId, Pageable pageable);
}
