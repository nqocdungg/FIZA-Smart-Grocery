package com.mealmate.recommendation.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.recommendation.scoring")
@Getter
@Setter
public class RecommendationScoringProperties {

    private int ingredientMatchMaxScore = 40;

    private int missingPenaltyPerIngredient = 10;

    private int missingPenaltyMaxScore = 30;

    private int expiryScoreWithin1Day = 25;

    private int expiryScoreWithin2Days = 20;

    private int expiryScoreWithin3Days = 15;

    private int expiryScoreWithin5Days = 10;

    private int expiryMaxScore = 25;

    private int mealTypeMatchScore = 20;

    private int mealTypeNullScore = 5;

    private int mealTypeMismatchScore = -10;

    private int favoriteScorePerMember = 15;

    private int recentPenaltyYesterday = 20;

    private int recentPenaltyWithin3Days = 15;

    private int recentPenaltyWithin7Days = 10;

    private int draftRandomPoolSize = 4;

    private int draftRandomRank1Weight = 50;

    private int draftRandomRank2Weight = 25;

    private int draftRandomRank3Weight = 15;

    private int draftRandomRank4Weight = 10;
}
