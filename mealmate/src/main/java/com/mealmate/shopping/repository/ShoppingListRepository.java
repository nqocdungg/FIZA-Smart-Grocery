package com.mealmate.shopping.repository;

import com.mealmate.shopping.model.ShoppingList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;


@Repository
public interface ShoppingListRepository extends JpaRepository<ShoppingList, Long> {
    List<ShoppingList> findByFamilyIdAndPlannedDateBetween(Long familyId, LocalDate start, LocalDate end);
    Optional<ShoppingList> findByFamilyIdAndPlannedDate(Long familyId, LocalDate date);
}
