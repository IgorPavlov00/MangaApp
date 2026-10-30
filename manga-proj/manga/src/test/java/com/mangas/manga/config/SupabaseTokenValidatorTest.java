package com.mangas.manga.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;

class SupabaseTokenValidatorTest {

    private static final String ISSUER = "https://abcd.supabase.co/auth/v1";
    private final OAuth2TokenValidator<Jwt> validator = SecurityConfig.supabaseTokenValidator(ISSUER);

    private static Jwt token(Consumer<Jwt.Builder> customizer) {
        Jwt.Builder builder = Jwt.withTokenValue("t")
                .header("alg", "ES256")
                .issuer(ISSUER)
                .subject("7f4c1a52-1111-4a2b-9c3d-000000000001")
                .audience(List.of("authenticated"))
                .claim("role", "authenticated")
                .issuedAt(Instant.now().minusSeconds(10))
                .expiresAt(Instant.now().plusSeconds(3600));
        customizer.accept(builder);
        return builder.build();
    }

    @Test
    void acceptsSignedInUserToken() {
        assertThat(validator.validate(token(b -> {})).hasErrors()).isFalse();
    }

    @Test
    void rejectsAnonKey() {
        assertThat(validator.validate(token(b -> b.claim("role", "anon").audience(List.of("anon")))).hasErrors()).isTrue();
    }

    @Test
    void rejectsTokenFromAnotherProject() {
        assertThat(validator.validate(token(b -> b.issuer("https://other.supabase.co/auth/v1"))).hasErrors()).isTrue();
    }

    @Test
    void rejectsExpiredToken() {
        assertThat(validator.validate(token(b -> b.issuedAt(Instant.now().minusSeconds(7200))
                .expiresAt(Instant.now().minusSeconds(3600)))).hasErrors()).isTrue();
    }
}
