package com.mealmate.shopping.repository;

import com.mealmate.shopping.model.ShoppingList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShoppingListRepository extends JpaRepository<ShoppingList, Long> {

    @Query("""
            SELECT shoppingList
            FROM ShoppingList shoppingList
            WHERE shoppingList.family.id = :familyId
            AND shoppingList.plannedDate BETWEEN :start AND :end
            """)
    List<ShoppingList> findByFamilyIdAndPlannedDateBetween(
            @Param("familyId") Long familyId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("""
            SELECT shoppingList
            FROM ShoppingList shoppingList
            WHERE shoppingList.family.id = :familyId
            AND shoppingList.plannedDate = :date
            """)
    Optional<ShoppingList> findByFamilyIdAndPlannedDate(
            @Param("familyId") Long familyId,
            @Param("date") LocalDate date);

    Optional<ShoppingList> findTopByFamily_IdOrderByCreatedDateDescCreatedAtDesc(Long familyId);
}
