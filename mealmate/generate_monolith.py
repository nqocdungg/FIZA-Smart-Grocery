import os
import shutil

ROOT = r"c:\code\IT4549.ITSS.Group7.TuanNM"
MEALMATE_ROOT = os.path.join(ROOT, "mealmate")
JAVA_ROOT = os.path.join(MEALMATE_ROOT, r"src\main\java\com\mealmate")

# 1. Clean up old services if they exist at ROOT
old_services = ["api-gateway", "discovery-server", "catalog-service", "user-service", "fridge-service", "shopping-service", "meal-service"]
for srv in old_services:
    path = os.path.join(ROOT, srv)
    if os.path.exists(path):
        shutil.rmtree(path, ignore_errors=True)

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# 2. Generates Common & Config
# common/base
write(os.path.join(JAVA_ROOT, r"common\base\BaseEntity.java"), """
package com.mealmate.common.base;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@MappedSuperclass
@Getter
@Setter
public abstract class BaseEntity {
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
""")

# common/dto
write(os.path.join(JAVA_ROOT, r"common\dto\ApiResponse.java"), """
package com.mealmate.common.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
}
""")

# common/exception
write(os.path.join(JAVA_ROOT, r"common\exception\ResourceNotFoundException.java"), """
package com.mealmate.common.exception;
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
""")

write(os.path.join(JAVA_ROOT, r"common\handler\GlobalExceptionHandler.java"), """
package com.mealmate.common.handler;

import com.mealmate.common.dto.ApiResponse;
import com.mealmate.common.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return new ResponseEntity<>(new ApiResponse<>(false, ex.getMessage(), null), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        return new ResponseEntity<>(new ApiResponse<>(false, "Có lỗi xảy ra: " + ex.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
""")

# Features setup
features = {
    "user": ["GiaDinh", "NguoiDung"],
    "catalog": ["ChungLoai", "ThucPham", "BienPhapBaoQuan", "MonAn", "NguyenLieuMonAn"],
    "fridge": ["DoTrongTuLanh"],
    "shopping": ["BanKeHoach", "ChiTietKeHoach"],
    "meal": ["ThucDon", "BuaAn", "ChiTietBuaAn", "MonTu"],
}

for feat, models in features.items():
    for model in models:
        # Controller
        write(os.path.join(JAVA_ROOT, feat, f"controller\\{model}Controller.java"), f"""
package com.mealmate.{feat}.controller;

import com.mealmate.{feat}.model.{model};
import com.mealmate.{feat}.service.{model}Service;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/{feat.lower()}s/{model.lower()}s")
@RequiredArgsConstructor
public class {model}Controller {{

    private final {model}Service service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<{model}>>> getAll() {{
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }}

    @PostMapping
    public ResponseEntity<ApiResponse<{model}>> create(@RequestBody {model} entity) {{
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }}
}}
""")

        # Model
        write(os.path.join(JAVA_ROOT, feat, f"model\\{model}.java"), f"""
package com.mealmate.{feat}.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class {model} extends BaseEntity {{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // TODO: Bổ sung các trường chi tiết
}}
""")

        # Repository
        write(os.path.join(JAVA_ROOT, feat, f"repository\\{model}Repository.java"), f"""
package com.mealmate.{feat}.repository;

import com.mealmate.{feat}.model.{model};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface {model}Repository extends JpaRepository<{model}, Long> {{
}}
""")

        # Service
        write(os.path.join(JAVA_ROOT, feat, f"service\\{model}Service.java"), f"""
package com.mealmate.{feat}.service;

import com.mealmate.{feat}.model.{model};
import com.mealmate.{feat}.repository.{model}Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class {model}Service {{

    private final {model}Repository repository;

    public List<{model}> findAll() {{
        return repository.findAll();
    }}

    public {model} save({model} entity) {{
        return repository.save(entity);
    }}
}}
""")

        # Mapper (empty for now)
        write(os.path.join(JAVA_ROOT, feat, f"mapper\\{model}Mapper.java"), f"""
package com.mealmate.{feat}.mapper;

import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface {model}Mapper {{
    // TODO: MapStruct mapping cho Controller
}}
""")

print("Successfully generated Monolithic architecture for Mealmate!")
