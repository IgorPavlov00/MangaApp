package com.mangas.manga.library;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Runs the Flyway migration against a real Postgres. Skipped when Docker is not available. */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers(disabledWithoutDocker = true)
class LibraryEntryRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17-alpine");

    @Autowired
    LibraryEntryRepository repository;

    private static LibraryEntry entry(UUID user, MediaType type, int malId, LibraryStatus status, Integer rating) {
        var e = new LibraryEntry(user, type, malId);
        e.setTitle("Title " + malId);
        e.setStatus(status);
        e.setRating(rating);
        return e;
    }

    @Test
    void enforcesOneEntryPerUserAndTitle() {
        UUID user = UUID.randomUUID();
        repository.saveAndFlush(entry(user, MediaType.MANGA, 2, LibraryStatus.PLANNING, null));

        assertThatThrownBy(() -> repository.saveAndFlush(entry(user, MediaType.MANGA, 2, LibraryStatus.COMPLETED, 9)))
                .isInstanceOf(DataIntegrityViolationException.class);
        // The same id as anime, or for another user, is fine.
        repository.saveAndFlush(entry(user, MediaType.ANIME, 2, LibraryStatus.PLANNING, null));
        repository.saveAndFlush(entry(UUID.randomUUID(), MediaType.MANGA, 2, LibraryStatus.PLANNING, null));
    }

    @Test
    void aggregatesCountsAndRatingsPerStatus() {
        UUID user = UUID.randomUUID();
        repository.saveAndFlush(entry(user, MediaType.MANGA, 1, LibraryStatus.COMPLETED, 8));
        repository.saveAndFlush(entry(user, MediaType.MANGA, 2, LibraryStatus.COMPLETED, null));
        repository.saveAndFlush(entry(user, MediaType.MANGA, 3, LibraryStatus.COMPLETED, 10));
        repository.saveAndFlush(entry(UUID.randomUUID(), MediaType.MANGA, 4, LibraryStatus.COMPLETED, 1));

        var rows = repository.countByStatus(user);

        assertThat(rows).singleElement().satisfies(row -> {
            assertThat(row.getCount()).isEqualTo(3);
            assertThat(row.getRatedCount()).isEqualTo(2);
            assertThat(row.getRatingSum()).isEqualTo(18);
        });
    }
}
