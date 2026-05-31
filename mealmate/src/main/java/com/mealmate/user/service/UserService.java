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

    public User update(Long id, User request) {
        User user = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setGender(request.getGender());
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        return repository.save(user);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("User not found");
        }
        repository.deleteById(id);
    }

    public List<User> findByFamilyId(Long familyId) {
        if (familyId == null) {
            return List.of();
        }
        // 🎯 ĐÃ CẬP NHẬT: Gọi hàm sắp xếp theo ID tăng dần từ UserRepository
        return repository.findByFamilyIdOrderByIdAsc(familyId);
    }
}