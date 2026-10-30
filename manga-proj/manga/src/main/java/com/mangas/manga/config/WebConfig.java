package com.mangas.manga.config;

import com.mangas.manga.library.MediaType;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        // Lets URLs and query params use "manga"/"anime" instead of the enum constant names.
        registry.addConverter(String.class, MediaType.class, MediaType::fromPath);
    }
}
