package com.mealmate.fridge.repository;

import com.mealmate.fridge.model.FridgeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FridgeItemRepository extends JpaRepository<FridgeItem, Long> {
}
