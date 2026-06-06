package com.mealmate.shopping.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DailyPlanSummaryDTO {
    private String plannedDate; // Định dạng "yyyy-MM-dd"
    private String dayOfWeek; // "Thứ 2"
    private String displayDate; // "4/5"
    private int totalItems;
    private int purchasedItems;
    private List<String> assigneeNames = new ArrayList<>();
    private Long listId;
    private String note;
}
