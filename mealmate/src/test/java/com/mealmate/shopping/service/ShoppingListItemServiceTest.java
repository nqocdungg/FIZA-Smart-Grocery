package com.mealmate.shopping.service;

import com.mealmate.shopping.model.ShoppingListItem;
import com.mealmate.shopping.repository.ShoppingListItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShoppingListItemServiceTest {

    @Mock
    private ShoppingListItemRepository repository;

    @InjectMocks
    private ShoppingListItemService service;

    @Test
    void should_FindAllItems_When_Called() {
        // given
        ShoppingListItem item1 = new ShoppingListItem();
        item1.setCustomName("Sữa tươi");

        ShoppingListItem item2 = new ShoppingListItem();
        item2.setCustomName("Bánh mì");

        when(repository.findAll()).thenReturn(List.of(item1, item2));

        // when
        List<ShoppingListItem> result = service.findAll();

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getCustomName()).isEqualTo("Sữa tươi");
        assertThat(result.get(1).getCustomName()).isEqualTo("Bánh mì");
        verify(repository).findAll();
    }

    @Test
    void should_SaveItem_When_ValidItem() {
        // given
        ShoppingListItem item = new ShoppingListItem();
        item.setCustomName("Trứng");

        ShoppingListItem savedItem = new ShoppingListItem();
        savedItem.setCustomName("Trứng");

        when(repository.save(item)).thenReturn(savedItem);

        // when
        ShoppingListItem result = service.save(item);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getCustomName()).isEqualTo("Trứng");
        verify(repository).save(item);
    }
}
