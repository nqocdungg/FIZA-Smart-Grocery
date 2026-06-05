package com.mealmate.user.repository;

import com.mealmate.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.family LEFT JOIN FETCH u.role WHERE u.email = :email")
    Optional<User> findByEmail(@Param("email") String email);

    boolean existsByEmail(String email);

    List<User> findByFamily_IdOrderByIdAsc(Long familyId);

    @Query(value = """
            SELECT
                u.id,
                u.email,
                u.full_name,
                u.phone,
                u.gender,
                u.avatar_url,
                COALESCE(r.name, 'Thành viên'),
                u.family_id,
                r.id
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.family_id = :familyId
            ORDER BY u.id ASC
            """, nativeQuery = true)
    List<Object[]> findRawMembersByFamilyId(@Param("familyId") Long familyId);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.family " +
           "WHERE u.email = :keyword OR u.phone = :keyword")
    Optional<User> findByEmailOrPhone(@Param("keyword") String keyword);

    @Query(value = "SELECT id FROM families WHERE housekeeper_id = :userId LIMIT 1", nativeQuery = true)
    Long findActualFamilyIdByHousekeeperId(@Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "UPDATE users SET family_id = :familyId, role_id = :roleId WHERE id = :userId", nativeQuery = true)
    void updateFamilyAndRoleDirectlyNative(@Param("userId") Long userId, @Param("familyId") Long familyId, @Param("roleId") Long roleId);
}
