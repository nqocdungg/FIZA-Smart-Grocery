package com.mealmate.report.service;

import com.mealmate.fridge.repository.FridgeItemRepository;
import com.mealmate.report.dto.ReportDetailDto;
import com.mealmate.report.dto.ReportOverviewResponse;
import com.mealmate.report.dto.ReportPointDto;
import com.mealmate.report.dto.ReportSummaryDto;
import com.mealmate.report.dto.ReportTrendDto;
import com.mealmate.report.dto.TrendItemDto;
import com.mealmate.report.dto.WasteDto;
import com.mealmate.user.model.User;
import com.mealmate.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final String STATUS_EXPIRED = "EXPIRED";
    private static final String STATUS_USED = "USED";
    private static final String[] TREND_COLORS = {
            "#FF6B6B", // Red-ish
            "#4DABF7", // Blue-ish
            "#51CF66", // Green-ish
            "#FCC419", // Yellow-ish
            "#FF922B", // Orange-ish
            "#845EF7", // Purple-ish
            "#20C997", // Teal-ish
            "#FF8787"  // Soft Red
    };

    private final FridgeItemRepository fridgeItemRepository;
    private final UserRepository userRepository;

    public ReportOverviewResponse getOverview(Long familyId, Long userId, LocalDate from, LocalDate to, Long categoryId) {
        Long resolvedFamilyId = resolveFamilyId(familyId, userId);
        if (resolvedFamilyId == null) {
            return buildEmptyReport(from, to);
        }

        DateRange previousRange = buildPreviousRange(from, to);

        long purchasedCount = safeCount(fridgeItemRepository.countItemsAddedToFridge(
                resolvedFamilyId,
                from,
                to,
                categoryId
        ));

        long previousPurchasedCount = safeCount(fridgeItemRepository.countItemsAddedToFridge(
                resolvedFamilyId,
                previousRange.from(),
                previousRange.to(),
                categoryId
        ));

        double purchasedChange = calculateChangePercent(previousPurchasedCount, purchasedCount);
        List<ReportPointDto> purchasedSeries = fillSeries(
            from,
            to,
            fridgeItemRepository.countItemsAddedToFridgeByDate(
                resolvedFamilyId,
                from,
                to,
                categoryId
            ),
            FridgeItemRepository.DateCountProjection::getDate,
            FridgeItemRepository.DateCountProjection::getCount
        );

        ReportSummaryDto summary = ReportSummaryDto.builder()
                .purchasedCount(purchasedCount)
                .changePercent(purchasedChange)
                .series(purchasedSeries)
                .build();

        ReportTrendDto trend = buildTrend(resolvedFamilyId, from, to, categoryId);

        long expiredCount = safeCount(fridgeItemRepository.countByStatusAndExpiryDateRange(
                resolvedFamilyId,
                STATUS_EXPIRED,
                from,
                to,
                categoryId
        ));

        long previousExpiredCount = safeCount(fridgeItemRepository.countByStatusAndExpiryDateRange(
                resolvedFamilyId,
                STATUS_EXPIRED,
                previousRange.from(),
                previousRange.to(),
                categoryId
        ));

        double expiredChange = calculateChangePercent(previousExpiredCount, expiredCount);
        WasteDto waste = WasteDto.builder()
                .expiredCount(expiredCount)
                .changePercent(expiredChange)
                .note(buildWasteNote(expiredChange))
                .build();

        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.plusDays(1).atStartOfDay();

        List<ReportPointDto> usedSeries = fillSeries(
            from,
            to,
            fridgeItemRepository.countByStatusAndUpdatedAtGroup(
                resolvedFamilyId,
                STATUS_USED,
                fromDateTime,
                toDateTime,
                categoryId
            ),
            FridgeItemRepository.DateCountProjection::getDate,
            FridgeItemRepository.DateCountProjection::getCount
        );

        List<ReportPointDto> expiredSeries = fillSeries(
            from,
            to,
            fridgeItemRepository.countByStatusAndExpiryDateGroup(
                resolvedFamilyId,
                STATUS_EXPIRED,
                from,
                to,
                categoryId
            ),
            FridgeItemRepository.DateCountProjection::getDate,
            FridgeItemRepository.DateCountProjection::getCount
        );

        ReportDetailDto detail = ReportDetailDto.builder()
                .purchaseSeries(purchasedSeries)
                .usedSeries(usedSeries)
                .expiredSeries(expiredSeries)
                .build();

        return ReportOverviewResponse.builder()
                .from(from)
                .to(to)
                .summary(summary)
                .trend(trend)
                .waste(waste)
                .detail(detail)
                .build();
    }

        private ReportOverviewResponse buildEmptyReport(LocalDate from, LocalDate to) {
        List<ReportPointDto> emptySeries = buildDateSeries(from, to, new HashMap<>());
        ReportSummaryDto summary = ReportSummaryDto.builder()
            .purchasedCount(0L)
            .changePercent(0D)
            .series(emptySeries)
            .build();

        ReportTrendDto trend = ReportTrendDto.builder()
            .totalCount(0L)
            .items(List.of())
            .build();

        WasteDto waste = WasteDto.builder()
            .expiredCount(0L)
            .changePercent(0D)
            .note(buildWasteNote(0))
            .build();

        ReportDetailDto detail = ReportDetailDto.builder()
            .purchaseSeries(emptySeries)
            .usedSeries(emptySeries)
            .expiredSeries(emptySeries)
            .build();

        return ReportOverviewResponse.builder()
            .from(from)
            .to(to)
            .summary(summary)
            .trend(trend)
            .waste(waste)
            .detail(detail)
            .build();
        }

    private Long resolveFamilyId(Long familyId, Long userId) {
        if (familyId != null) {
            return familyId;
        }
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .map(User::getFamily)
                .map(family -> family.getId())
                .orElse(null);
    }

    private DateRange buildPreviousRange(LocalDate from, LocalDate to) {
        long totalDays = ChronoUnit.DAYS.between(from, to) + 1;
        LocalDate previousTo = from.minusDays(1);
        LocalDate previousFrom = previousTo.minusDays(totalDays - 1);
        return new DateRange(previousFrom, previousTo);
    }

    private long safeCount(Long value) {
        return value == null ? 0 : value;
    }

    private double calculateChangePercent(long previous, long current) {
        if (previous == 0) {
            return current == 0 ? 0 : 100;
        }
        return ((current - previous) * 100.0) / previous;
    }

    private ReportTrendDto buildTrend(Long familyId, LocalDate from, LocalDate to, Long categoryId) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.plusDays(1).atStartOfDay();
        List<FridgeItemRepository.CategoryCountProjection> rows =
                fridgeItemRepository.countByStatusAndUpdatedAtByCategory(
                        familyId,
                        STATUS_USED,
                        fromDateTime,
                        toDateTime,
                        categoryId
                );

        long totalCount = rows.stream()
                .mapToLong(row -> row.getCount() == null ? 0 : row.getCount())
                .sum();

        List<TrendItemDto> items = new ArrayList<>();
        int colorIndex = 0;

        for (FridgeItemRepository.CategoryCountProjection row : rows) {
            long count = row.getCount() == null ? 0 : row.getCount();
            double percent = totalCount == 0 ? 0 : (count * 100.0) / totalCount;
            String label = row.getCategoryName() == null ? "Chưa phân loại" : row.getCategoryName();
            String color = TREND_COLORS[colorIndex % TREND_COLORS.length];
            colorIndex += 1;

            items.add(TrendItemDto.builder()
                    .categoryId(row.getCategoryId())
                    .label(label)
                    .count(count)
                    .percent(percent)
                    .color(color)
                    .build());
        }

        return ReportTrendDto.builder()
                .totalCount(totalCount)
                .items(items)
                .build();
    }

    private <T> List<ReportPointDto> fillSeries(
            LocalDate from,
            LocalDate to,
            List<T> rows,
            Function<T, LocalDate> dateGetter,
            Function<T, Long> countGetter
    ) {
        Map<LocalDate, Long> countByDate = new HashMap<>();
        for (T row : rows) {
            LocalDate date = dateGetter.apply(row);
            if (date != null) {
                countByDate.put(date, safeCount(countGetter.apply(row)));
            }
        }
        return buildDateSeries(from, to, countByDate);
    }

    private List<ReportPointDto> buildDateSeries(LocalDate from, LocalDate to, Map<LocalDate, Long> countByDate) {
        List<ReportPointDto> series = new ArrayList<>();
        LocalDate cursor = from;
        while (!cursor.isAfter(to)) {
            series.add(ReportPointDto.builder()
                    .date(cursor)
                    .value(countByDate.getOrDefault(cursor, 0L))
                    .build());
            cursor = cursor.plusDays(1);
        }
        return series;
    }

    private String buildWasteNote(double changePercent) {
        if (changePercent < 0) {
            return "Hãy duy trì thói quen kiểm tra hạn sử dụng.";
        }
        if (changePercent > 0) {
            return "Hãy kiểm tra ngăn đông thường xuyên hơn.";
        }
        return "Hãy kiểm tra tủ lạnh định kỳ.";
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }
}
