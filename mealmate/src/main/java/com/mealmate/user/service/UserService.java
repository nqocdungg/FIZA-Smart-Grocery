package com.mealmate.user.service;

import com.mealmate.user.model.User;
import com.mealmate.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;

    public List<User> findAll() {
        return repository.findAll();
    }

    public User save(User entity) {
        if (entity == null) {
            throw new IllegalArgumentException("User entity must not be null");
        }
        return repository.save(entity);
    }

    public List<User> findByFamilyId(Long familyId) {
        if (familyId == null) {
            return List.of();
        }
        return repository.findByFamily_IdOrderByIdAsc(familyId);
    }
}
