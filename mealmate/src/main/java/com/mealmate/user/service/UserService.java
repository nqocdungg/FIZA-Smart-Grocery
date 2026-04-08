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
        return repository.save(entity);
    }
}
