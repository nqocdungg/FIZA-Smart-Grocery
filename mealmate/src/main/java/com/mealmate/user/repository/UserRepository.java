package com.mealmate.user.repository;

import com.mealmate.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // Query theo quan hệ User.family.id và sắp xếp theo ID tăng dần
    List<User> findByFamily_IdOrderByIdAsc(Long familyId);
}
