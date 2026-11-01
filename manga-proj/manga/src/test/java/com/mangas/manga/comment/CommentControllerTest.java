package com.mangas.manga.comment;

import com.mangas.manga.comment.CommentDtos.CommentPage;
import com.mangas.manga.comment.CommentDtos.CommentRequest;
import com.mangas.manga.comment.CommentDtos.CommentResponse;
import com.mangas.manga.common.NotFoundException;
import com.mangas.manga.config.AppProperties;
import com.mangas.manga.config.SecurityConfig;
import com.mangas.manga.library.MediaType;
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
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = CommentController.class, properties = {
        "app.supabase.url=https://test.supabase.co",
        "app.cors.allowed-origins=http://localhost:4200",
        "app.jikan.base-url=https://api.jikan.moe/v4"
})
@Import(CommentControllerTest.Config.class)
class CommentControllerTest {

    @TestConfiguration
    @Import(SecurityConfig.class)
    @EnableConfigurationProperties(AppProperties.class)
    static class Config {
    }

    private static final UUID USER = UUID.fromString("7f4c1a52-1111-4a2b-9c3d-000000000001");

    @Autowired
    MockMvc mvc;

    @MockitoBean
    CommentService service;

    @MockitoBean
    JwtDecoder jwtDecoder;

    private static RequestPostProcessor user() {
        return jwt().jwt(j -> j.subject(USER.toString()).claim("user_metadata", Map.of("display_name", "Guts")));
    }

    private static CommentResponse comment(boolean mine) {
        return new CommentResponse(1, MediaType.MANGA, 2, "Guts", "Peak fiction", false, mine, false,
                Instant.EPOCH, Instant.EPOCH);
    }

    @Test
    void anyoneCanReadComments() throws Exception {
        when(service.list(MediaType.MANGA, 2, 0, null)).thenReturn(new CommentPage(List.of(comment(false)), 0, 1, 1));

        mvc.perform(get("/api/comments/manga/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].body").value("Peak fiction"))
                .andExpect(jsonPath("$.items[0].mine").value(false))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void signedInReaderSeesTheirOwnComments() throws Exception {
        when(service.list(MediaType.MANGA, 2, 0, USER)).thenReturn(new CommentPage(List.of(comment(true)), 0, 1, 1));

        mvc.perform(get("/api/comments/manga/2").with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].mine").value(true));
    }

    @Test
    void postingRequiresToken() throws Exception {
        mvc.perform(post("/api/comments/manga/2").contentType("application/json").content("{\"body\":\"hi\"}"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }

    @Test
    void postsCommentAsTheSignedInUser() throws Exception {
        when(service.create(eq(USER), eq("Guts"), eq(MediaType.ANIME), eq(5114), any())).thenReturn(comment(true));

        mvc.perform(post("/api/comments/anime/5114").with(user())
                        .contentType("application/json")
                        .content("{\"body\":\"Peak fiction\",\"spoiler\":true}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.authorName").value("Guts"));

        verify(service).create(USER, "Guts", MediaType.ANIME, 5114, new CommentRequest("Peak fiction", true));
    }

    @Test
    void rejectsBlankComment() throws Exception {
        mvc.perform(post("/api/comments/manga/2").with(user())
                        .contentType("application/json")
                        .content("{\"body\":\"   \"}"))
                .andExpect(status().isBadRequest());
        verify(service, org.mockito.Mockito.never()).create(any(), any(), any(), anyInt(), any());
    }

    @Test
    void deletingSomeoneElsesCommentIsNotFound() throws Exception {
        doThrow(new NotFoundException("Comment 9 was not found")).when(service).delete(USER, 9);

        mvc.perform(delete("/api/comments/9").with(user()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Comment 9 was not found"));
    }
}
