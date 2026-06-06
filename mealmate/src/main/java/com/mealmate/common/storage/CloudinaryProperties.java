package com.mealmate.common.storage;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.cloudinary")
public class CloudinaryProperties {

    private String cloudName;

    private String apiKey;

    private String apiSecret;

    private String recipeFolder = "mealmate/recipes";

    private String uploadFolder = "mealmate/uploads";
}
