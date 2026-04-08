package com.mealmate.fridge.service;

import com.mealmate.fridge.model.FridgeItem;
import com.mealmate.fridge.repository.FridgeItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FridgeItemService {

    private final FridgeItemRepository repository;

    public List<FridgeItem> findAll() {
        return repository.findAll();
    }

    public FridgeItem save(FridgeItem entity) {
        return repository.save(entity);
    }
}
