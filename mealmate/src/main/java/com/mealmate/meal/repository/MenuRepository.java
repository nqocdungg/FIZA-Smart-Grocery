package com.mealmate.meal.repository;

import com.mealmate.meal.model.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {

    Optional<Menu> findFirstByFamily_IdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long familyId,
            LocalDate date,
            LocalDate dateAgain
    );
}
