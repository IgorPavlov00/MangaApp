package com.mangas.manga.library;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LibraryEntryRepository extends JpaRepository<LibraryEntry, Long> {

    List<LibraryEntry> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    List<LibraryEntry> findByUserIdAndMediaTypeOrderByUpdatedAtDesc(UUID userId, MediaType mediaType);

    Optional<LibraryEntry> findByUserIdAndMediaTypeAndMalId(UUID userId, MediaType mediaType, Integer malId);

    @Query("""
            select e.mediaType as mediaType, e.status as status, count(e) as count,
                   count(e.rating) as ratedCount, sum(e.rating) as ratingSum
            from LibraryEntry e
            where e.userId = :userId
            group by e.mediaType, e.status
            """)
    List<StatusCount> countByStatus(UUID userId);

    interface StatusCount {
        MediaType getMediaType();

        LibraryStatus getStatus();

        long getCount();

        long getRatedCount();

        Long getRatingSum();
    }
}
