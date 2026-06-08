package com.mealmate.catalog.repository;

import com.mealmate.catalog.model.PreservationMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PreservationMethodRepository extends JpaRepository<PreservationMethod, Long> {

    // 🎯 THÊM HÀM NÀY: Quét đích danh bản ghi bảo quản ăn theo food_id
    @Query("SELECT m FROM PreservationMethod m WHERE m.food.id = :foodId")
    Optional<PreservationMethod> findByFoodId(@Param("foodId") Long foodId);
}