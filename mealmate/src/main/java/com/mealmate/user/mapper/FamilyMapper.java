package com.mealmate.user.mapper;

import com.mealmate.user.model.Family;
import com.mealmate.user.model.dto.FamilyResponse;
import org.springframework.stereotype.Component;

@Component
public class FamilyMapper {

    public FamilyResponse toResponse(Family family) {
        if (family == null) {
            return null;
        }
        return new FamilyResponse(
                family.getId(),
                family.getName(),
                family.getHousekeeperId()
        );
    }
}
