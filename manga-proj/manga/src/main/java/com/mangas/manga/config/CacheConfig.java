package com.mangas.manga.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/** Caches Jikan responses (see spring.cache.* in application.yml). */
@Configuration
@EnableCaching
public class CacheConfig {
}
