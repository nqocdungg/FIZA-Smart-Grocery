package com.mealmate.shopping.service;

import com.mealmate.shopping.model.ShoppingListItem;
import com.mealmate.shopping.repository.ShoppingListItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShoppingListItemService {

    private final ShoppingListItemRepository repository;

    public List<ShoppingListItem> findAll() {
        return repository.findAll();
    }

    public ShoppingListItem save(ShoppingListItem entity) {
        return repository.save(entity);
    }
}
