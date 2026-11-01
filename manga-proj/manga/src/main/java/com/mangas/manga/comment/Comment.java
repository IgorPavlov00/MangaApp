package com.mangas.manga.comment;

import com.mangas.manga.library.MediaType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/** A comment a user left on a manga or anime. Visible to everyone; only the author can edit or delete it. */
@Entity
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Supabase auth user id (JWT "sub"). */
    @Column(nullable = false, updatable = false)
    private UUID userId;

    /** Display name snapshotted from the token when the comment is written. */
    @Column(nullable = false)
    private String authorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false)
    private MediaType mediaType;

    @Column(nullable = false, updatable = false)
    private Integer malId;

    @Column(nullable = false)
    private String body;

    private boolean spoiler;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Comment() {
    }

    public Comment(UUID userId, MediaType mediaType, Integer malId) {
        this.userId = userId;
        this.mediaType = mediaType;
        this.malId = malId;
    }

    @PrePersist
    void onCreate() {
        createdAt = updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public MediaType getMediaType() {
        return mediaType;
    }

    public Integer getMalId() {
        return malId;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public boolean isSpoiler() {
        return spoiler;
    }

    public void setSpoiler(boolean spoiler) {
        this.spoiler = spoiler;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
