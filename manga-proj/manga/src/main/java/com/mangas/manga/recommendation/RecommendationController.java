package com.mangas.manga.recommendation;

import com.mangas.manga.common.CurrentUser;
import com.mangas.manga.library.MediaType;
import com.mangas.manga.recommendation.RecommendationService.RecommendationResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService service;

    public RecommendationController(RecommendationService service) {
        this.service = service;
    }

    @GetMapping
    public List<RecommendationResponse> recommendations(@AuthenticationPrincipal Jwt jwt,
                                                        @RequestParam(defaultValue = "manga") MediaType mediaType,
                                                        @RequestParam(defaultValue = "12") @Min(1) @Max(50) int limit) {
        return service.recommend(CurrentUser.id(jwt), mediaType, limit);
    }
}
