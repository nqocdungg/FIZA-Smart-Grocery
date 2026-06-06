package com.mealmate.common.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
@RequiredArgsConstructor
public class CloudinaryStorageService {

    private final Cloudinary cloudinary;
    private final CloudinaryProperties properties;

    public FileUploadResponse uploadFile(MultipartFile file, String folder) {
        validateSupportedFile(file);
        validateConfigured();

        String contentType = file.getContentType();
        String resourceType = resolveResourceType(contentType);
        String targetFolder = normalizeFolder(folder);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", targetFolder,
                            "resource_type", resourceType
                    )
            );

            return FileUploadResponse.builder()
                    .url(String.valueOf(result.get("secure_url")))
                    .publicId(String.valueOf(result.get("public_id")))
                    .resourceType(resourceType)
                    .contentType(contentType)
                    .originalFilename(file.getOriginalFilename())
                    .bytes(file.getSize())
                    .build();
        } catch (IOException exception) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Cannot read upload file", exception);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Cloudinary upload failed", exception);
        }
    }

    private void validateSupportedFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Upload file is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new ResponseStatusException(BAD_REQUEST, "Only image and PDF files are allowed");
        }
    }

    private void validateConfigured() {
        if (isBlank(properties.getCloudName()) || isBlank(properties.getApiKey()) || isBlank(properties.getApiSecret())) {
            throw new ResponseStatusException(BAD_REQUEST, "Cloudinary is not configured");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String resolveResourceType(String contentType) {
        return contentType != null && contentType.startsWith("image/") ? "image" : "raw";
    }

    private String normalizeFolder(String folder) {
        String normalizedFolder = isBlank(folder) ? properties.getUploadFolder() : folder.trim();
        if (!normalizedFolder.matches("[A-Za-z0-9/_-]+")) {
            throw new ResponseStatusException(BAD_REQUEST, "Upload folder contains unsupported characters");
        }
        return normalizedFolder;
    }
}
