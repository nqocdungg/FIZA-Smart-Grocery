package com.mealmate.catalog.service;

import com.mealmate.catalog.model.PreservationMethod;
import com.mealmate.catalog.repository.PreservationMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PreservationMethodService {

    private final PreservationMethodRepository repository;

    public List<PreservationMethod> findAll() {
        return repository.findAll();
    }

    public PreservationMethod save(PreservationMethod entity) {
        return repository.save(entity);
    }
}
