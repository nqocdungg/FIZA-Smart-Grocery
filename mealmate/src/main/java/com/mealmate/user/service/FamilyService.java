package com.mealmate.user.service;

import com.mealmate.user.model.Family;
import com.mealmate.user.repository.FamilyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyRepository repository;

    public List<Family> findAll() {
        return repository.findAll();
    }

    public Family save(Family entity) {
        return repository.save(entity);
    }
}
