package com.mangas.manga.library;

import com.mangas.manga.common.NotFoundException;
import com.mangas.manga.library.LibraryDtos.EntryResponse;
import com.mangas.manga.library.LibraryDtos.MediaStats;
import com.mangas.manga.library.LibraryDtos.SaveEntryRequest;
import com.mangas.manga.library.LibraryDtos.StatsResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class LibraryService {

    private final LibraryEntryRepository repository;

    public LibraryService(LibraryEntryRepository repository) {
        this.repository = repository;
    }

    public List<EntryResponse> list(UUID userId, MediaType mediaType, LibraryStatus status) {
        List<LibraryEntry> entries = mediaType == null
                ? repository.findByUserIdOrderByUpdatedAtDesc(userId)
                : repository.findByUserIdAndMediaTypeOrderByUpdatedAtDesc(userId, mediaType);
        return entries.stream()
                .filter(e -> status == null || e.getStatus() == status)
                .map(EntryResponse::from)
                .toList();
    }

    public EntryResponse get(UUID userId, MediaType mediaType, int malId) {
        return repository.findByUserIdAndMediaTypeAndMalId(userId, mediaType, malId)
                .map(EntryResponse::from)
                .orElseThrow(() -> notInLibrary(mediaType, malId));
    }

    @Transactional
    public EntryResponse save(UUID userId, MediaType mediaType, int malId, SaveEntryRequest request) {
        LibraryEntry entry = repository.findByUserIdAndMediaTypeAndMalId(userId, mediaType, malId)
                .orElseGet(() -> new LibraryEntry(userId, mediaType, malId));
        entry.setTitle(request.title().trim());
        entry.setImageUrl(request.imageUrl());
        entry.setStatus(request.status());
        entry.setRating(request.rating());
        entry.setProgress(request.progress());
        entry.setFavorite(request.isFavorite());
        return EntryResponse.from(repository.saveAndFlush(entry));
    }

    @Transactional
    public void delete(UUID userId, MediaType mediaType, int malId) {
        LibraryEntry entry = repository.findByUserIdAndMediaTypeAndMalId(userId, mediaType, malId)
                .orElseThrow(() -> notInLibrary(mediaType, malId));
        repository.delete(entry);
    }

    public StatsResponse stats(UUID userId) {
        Map<MediaType, Map<LibraryStatus, Long>> counts = new EnumMap<>(MediaType.class);
        Map<MediaType, double[]> ratingSums = new EnumMap<>(MediaType.class); // [sum of ratings, rated count]
        for (MediaType type : MediaType.values()) {
            Map<LibraryStatus, Long> byStatus = new EnumMap<>(LibraryStatus.class);
            for (LibraryStatus status : LibraryStatus.values()) {
                byStatus.put(status, 0L);
            }
            counts.put(type, byStatus);
            ratingSums.put(type, new double[2]);
        }
        for (var row : repository.countByStatus(userId)) {
            counts.get(row.getMediaType()).put(row.getStatus(), row.getCount());
            if (row.getRatedCount() > 0) {
                double[] sum = ratingSums.get(row.getMediaType());
                sum[0] += row.getRatingSum();
                sum[1] += row.getRatedCount();
            }
        }
        return new StatsResponse(toStats(counts.get(MediaType.MANGA), ratingSums.get(MediaType.MANGA)),
                toStats(counts.get(MediaType.ANIME), ratingSums.get(MediaType.ANIME)));
    }

    private static MediaStats toStats(Map<LibraryStatus, Long> byStatus, double[] ratingSum) {
        long total = byStatus.values().stream().mapToLong(Long::longValue).sum();
        Double average = ratingSum[1] == 0 ? null : Math.round(ratingSum[0] / ratingSum[1] * 10) / 10.0;
        return new MediaStats(total, byStatus, average);
    }

    private static NotFoundException notInLibrary(MediaType mediaType, int malId) {
        return new NotFoundException(mediaType.path() + " " + malId + " is not in your library");
    }
}
