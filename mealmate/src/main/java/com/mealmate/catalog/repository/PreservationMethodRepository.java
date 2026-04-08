package com.mealmate.catalog.repository;

import com.mealmate.catalog.model.PreservationMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PreservationMethodRepository extends JpaRepository<PreservationMethod, Long> {
}
