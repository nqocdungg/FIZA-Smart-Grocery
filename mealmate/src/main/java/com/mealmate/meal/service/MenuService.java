package com.mealmate.meal.service;

import com.mealmate.meal.model.Menu;
import com.mealmate.meal.repository.MenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuRepository repository;

    public List<Menu> findAll() {
        return repository.findAll();
    }

    public Menu save(Menu entity) {
        return repository.save(entity);
    }
}
