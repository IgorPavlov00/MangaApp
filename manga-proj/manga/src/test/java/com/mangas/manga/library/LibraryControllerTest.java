package com.mangas.manga.library;

import com.mangas.manga.common.NotFoundException;
import com.mangas.manga.config.AppProperties;
import com.mangas.manga.config.SecurityConfig;
import com.mangas.manga.library.LibraryDtos.EntryResponse;
import com.mangas.manga.library.LibraryDtos.SaveEntryRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = LibraryController.class, properties = {
        "app.supabase.url=https://test.supabase.co",
        "app.cors.allowed-origins=http://localhost:4200",
        "app.jikan.base-url=https://api.jikan.moe/v4"
})
@Import(LibraryControllerTest.Config.class)
class LibraryControllerTest {

    @TestConfiguration
    @Import(SecurityConfig.class)
    @EnableConfigurationProperties(AppProperties.class)
    static class Config {
    }

    private static final UUID USER = UUID.fromString("7f4c1a52-1111-4a2b-9c3d-000000000001");

    @Autowired
    MockMvc mvc;

    @MockitoBean
    LibraryService service;

    @MockitoBean
    JwtDecoder jwtDecoder;

    private static RequestPostProcessor user() {
        return jwt().jwt(j -> j.subject(USER.toString()).claim("email", "reader@example.com"));
    }

    @Test
    void rejectsRequestsWithoutToken() throws Exception {
        mvc.perform(get("/api/library")).andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }

    @Test
    void listsOnlyTheCallersEntries() throws Exception {
        when(service.list(USER, MediaType.MANGA, null)).thenReturn(List.of(new EntryResponse(MediaType.MANGA, 2,
                "Berserk", null, LibraryStatus.IN_PROGRESS, 10, 120, true, Instant.EPOCH, Instant.EPOCH)));

        mvc.perform(get("/api/library").param("mediaType", "manga").with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Berserk"))
                .andExpect(jsonPath("$[0].status").value("IN_PROGRESS"));
    }

    @Test
    void savesEntryUsingLowercaseMediaTypeInPath() throws Exception {
        when(service.save(eq(USER), eq(MediaType.ANIME), eq(5114), any())).thenReturn(new EntryResponse(MediaType.ANIME,
                5114, "Fullmetal Alchemist: Brotherhood", null, LibraryStatus.COMPLETED, 9, 64, false, Instant.EPOCH, Instant.EPOCH));

        mvc.perform(put("/api/library/anime/5114").with(user())
                        .contentType("application/json")
                        .content("""
                                {"title":"Fullmetal Alchemist: Brotherhood","status":"COMPLETED","rating":9,"progress":64}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mediaType").value("ANIME"));

        verify(service).save(USER, MediaType.ANIME, 5114,
                new SaveEntryRequest("Fullmetal Alchemist: Brotherhood", null, LibraryStatus.COMPLETED, 9, 64, null));
    }

    @Test
    void rejectsInvalidRating() throws Exception {
        mvc.perform(put("/api/library/manga/2").with(user())
                        .contentType("application/json")
                        .content("""
                                {"title":"Berserk","status":"COMPLETED","rating":11}
                                """))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void rejectsUnknownMediaType() throws Exception {
        mvc.perform(get("/api/library/novel/2").with(user())).andExpect(status().isBadRequest());
    }

    @Test
    void returnsNotFoundProblemWhenEntryMissing() throws Exception {
        doThrow(new NotFoundException("manga 2 is not in your library")).when(service).delete(USER, MediaType.MANGA, 2);

        mvc.perform(delete("/api/library/manga/2").with(user()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("manga 2 is not in your library"));
    }

    @Test
    void filtersByStatus() throws Exception {
        when(service.list(eq(USER), isNull(), eq(LibraryStatus.PLANNING))).thenReturn(List.of());

        mvc.perform(get("/api/library").param("status", "PLANNING").with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }
}
