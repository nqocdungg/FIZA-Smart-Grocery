package com.mealmate.report.service;

import com.mealmate.fridge.repository.FridgeItemRepository;
import com.mealmate.report.dto.ReportOverviewResponse;
import com.mealmate.user.model.Family;
import com.mealmate.user.model.User;
import com.mealmate.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private FridgeItemRepository fridgeItemRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReportService reportService;

    @Test
    void should_ReturnOverviewReport_When_ValidParameters() {
        // given
        Long familyId = 1L;
        Long userId = 2L;
        LocalDate from = LocalDate.of(2026, 6, 1);
        LocalDate to = LocalDate.of(2026, 6, 7);
        Long categoryId = null;

        LocalDate prevFrom = LocalDate.of(2026, 5, 25);
        LocalDate prevTo = LocalDate.of(2026, 5, 31);

        when(fridgeItemRepository.countItemsAddedToFridge(eq(familyId), eq(from), eq(to), eq(categoryId))).thenReturn(10L);
        when(fridgeItemRepository.countItemsAddedToFridge(eq(familyId), eq(prevFrom), eq(prevTo), eq(categoryId))).thenReturn(8L);
        when(fridgeItemRepository.countItemsAddedToFridgeByDate(eq(familyId), eq(from), eq(to), eq(categoryId))).thenReturn(Collections.emptyList());

        when(fridgeItemRepository.countByStatusAndExpiryDateRange(eq(familyId), eq("EXPIRED"), eq(from), eq(to), eq(categoryId))).thenReturn(2L);
        when(fridgeItemRepository.countByStatusAndExpiryDateRange(eq(familyId), eq("EXPIRED"), eq(prevFrom), eq(prevTo), eq(categoryId))).thenReturn(1L);

        when(fridgeItemRepository.countByStatusAndUpdatedAtByCategory(eq(familyId), eq("USED"), any(), any(), eq(categoryId))).thenReturn(Collections.emptyList());
        when(fridgeItemRepository.countByStatusAndUpdatedAtGroup(eq(familyId), eq("USED"), any(), any(), eq(categoryId))).thenReturn(Collections.emptyList());
        when(fridgeItemRepository.countByStatusAndExpiryDateGroup(eq(familyId), eq("EXPIRED"), eq(from), eq(to), eq(categoryId))).thenReturn(Collections.emptyList());

        // when
        ReportOverviewResponse response = reportService.getOverview(familyId, userId, from, to, categoryId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getFrom()).isEqualTo(from);
        assertThat(response.getTo()).isEqualTo(to);
        assertThat(response.getSummary().getPurchasedCount()).isEqualTo(10L);
        assertThat(response.getWaste().getExpiredCount()).isEqualTo(2L);
    }

    @Test
    void should_ReturnEmptyReport_When_FamilyIdNullAndUserHasNoFamily() {
        // given
        Long familyId = null;
        Long userId = 2L;
        LocalDate from = LocalDate.of(2026, 6, 1);
        LocalDate to = LocalDate.of(2026, 6, 7);
        Long categoryId = null;

        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // when
        ReportOverviewResponse response = reportService.getOverview(familyId, userId, from, to, categoryId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getSummary().getPurchasedCount()).isEqualTo(0L);
        assertThat(response.getTrend().getItems()).isEmpty();
        assertThat(response.getWaste().getExpiredCount()).isEqualTo(0L);
    }
}
