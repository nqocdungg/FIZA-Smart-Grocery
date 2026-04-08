package com.mealmate.shopping.service;

import com.mealmate.shopping.model.ShoppingList;
import com.mealmate.shopping.repository.ShoppingListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShoppingListService {

    private final ShoppingListRepository repository;

    public List<ShoppingList> findAll() {
        return repository.findAll();
    }

    public ShoppingList save(ShoppingList entity) {
        return repository.save(entity);
    }
}
