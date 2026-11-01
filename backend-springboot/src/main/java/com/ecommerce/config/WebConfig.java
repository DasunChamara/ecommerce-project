package com.ecommerce.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // uploads/ folder එකේ ඇති පින්තූර http://localhost:8081/uploads/... හරහා පෙන්වීම
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }
}