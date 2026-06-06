package com.mealmate.common.storage;

import com.cloudinary.Cloudinary;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableConfigurationProperties(CloudinaryProperties.class)
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary(CloudinaryProperties properties) {
        Map<String, Object> config = new HashMap<>();
        config.put("cloud_name", blankToNull(properties.getCloudName()));
        config.put("api_key", blankToNull(properties.getApiKey()));
        config.put("api_secret", blankToNull(properties.getApiSecret()));
        config.put("secure", true);
        return new Cloudinary(config);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
