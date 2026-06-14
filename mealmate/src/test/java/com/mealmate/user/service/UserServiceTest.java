package com.mealmate.user.service;

import com.mealmate.user.model.User;
import com.mealmate.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository repository;

    @InjectMocks
    private UserService service;

    @Test
    void should_FindAllUsers_When_Called() {
        // given
        User u1 = new User();
        u1.setEmail("u1@gmail.com");
        User u2 = new User();
        u2.setEmail("u2@gmail.com");

        when(repository.findAll()).thenReturn(List.of(u1, u2));

        // when
        List<User> result = service.findAll();

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getEmail()).isEqualTo("u1@gmail.com");
    }

    @Test
    void should_SaveUser_When_ValidUser() {
        // given
        User user = new User();
        user.setEmail("test@gmail.com");

        User saved = new User();
        saved.setId(1L);
        saved.setEmail("test@gmail.com");

        when(repository.save(user)).thenReturn(saved);

        // when
        User result = service.save(user);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void should_ThrowException_When_SavingNullUser() {
        // given
        User user = null;

        // when & then
        assertThatThrownBy(() -> service.save(user))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User entity must not be null");
    }

    @Test
    void should_UpdateUser_When_UserExists() {
        // given
        Long id = 1L;
        User existingUser = new User();
        existingUser.setId(id);
        existingUser.setFullName("Old Name");
        existingUser.setEmail("old@gmail.com");

        User request = new User();
        request.setFullName("New Name");
        request.setEmail("new@gmail.com");

        User updatedUser = new User();
        updatedUser.setId(id);
        updatedUser.setFullName("New Name");
        updatedUser.setEmail("new@gmail.com");

        when(repository.findById(id)).thenReturn(Optional.of(existingUser));
        when(repository.save(existingUser)).thenReturn(updatedUser);

        // when
        User result = service.update(id, request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getFullName()).isEqualTo("New Name");
        assertThat(result.getEmail()).isEqualTo("new@gmail.com");
    }

    @Test
    void should_DeleteUser_When_UserExists() {
        // given
        Long id = 1L;
        when(repository.existsById(id)).thenReturn(true);

        // when
        service.delete(id);

        // then
        verify(repository).deleteById(id);
    }

    @Test
    void should_SearchByEmailOrPhone_When_KeywordProvided() {
        // given
        String keyword = "test@gmail.com";
        User user = new User();
        user.setEmail(keyword);

        when(repository.findByEmailOrPhone(keyword)).thenReturn(Optional.of(user));

        // when
        User result = service.searchByEmailOrPhone(keyword);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo(keyword);
    }
}
