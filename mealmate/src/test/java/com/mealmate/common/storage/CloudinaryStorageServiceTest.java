package com.mealmate.common.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CloudinaryStorageServiceTest {

    @Mock
    private Cloudinary cloudinary;
    @Mock
    private Uploader uploader;
    @Mock
    private CloudinaryProperties properties;

    @InjectMocks
    private CloudinaryStorageService cloudinaryStorageService;

    // Helper to mock configuration
    private void mockConfiguration(String cloudName, String apiKey, String apiSecret, String uploadFolder) {
        org.mockito.Mockito.lenient().when(properties.getCloudName()).thenReturn(cloudName);
        org.mockito.Mockito.lenient().when(properties.getApiKey()).thenReturn(apiKey);
        org.mockito.Mockito.lenient().when(properties.getApiSecret()).thenReturn(apiSecret);
        if (uploadFolder != null) {
            org.mockito.Mockito.lenient().when(properties.getUploadFolder()).thenReturn(uploadFolder);
        }
    }

    // --- CASE 1: Upload thành công (uploadFile) ---

    @Test
    void should_UploadFileSuccessfully_When_ValidImageFile() throws IOException {
        // given
        mockConfiguration("test-cloud", "test-key", "test-secret", "mealmate/uploads");

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/jpeg");
        when(file.getBytes()).thenReturn(new byte[]{1, 2, 3});
        when(file.getOriginalFilename()).thenReturn("photo.jpg");
        when(file.getSize()).thenReturn(3L);

        when(cloudinary.uploader()).thenReturn(uploader);
        Map<String, Object> uploadResult = Map.of(
                "secure_url", "https://res.cloudinary.com/test-cloud/image/upload/photo.jpg",
                "public_id", "mealmate/uploads/photo"
        );
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(uploadResult);

        // when
        FileUploadResponse response = cloudinaryStorageService.uploadFile(file, null);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getUrl()).isEqualTo("https://res.cloudinary.com/test-cloud/image/upload/photo.jpg");
        assertThat(response.getPublicId()).isEqualTo("mealmate/uploads/photo");
        assertThat(response.getResourceType()).isEqualTo("image");
        assertThat(response.getContentType()).isEqualTo("image/jpeg");
        assertThat(response.getOriginalFilename()).isEqualTo("photo.jpg");
        assertThat(response.getBytes()).isEqualTo(3L);

        verify(uploader).upload(eq(new byte[]{1, 2, 3}), anyMap());
    }

    // --- CASE 2: Kiểm tra validation file lỗi ---

    @Test
    void should_ThrowException_When_UploadFileIsEmpty() {
        // given
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);

        // when / then
        assertThatThrownBy(() -> cloudinaryStorageService.uploadFile(file, "folder"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Upload file is required");
    }

    @Test
    void should_ThrowException_When_ContentTypeIsUnsupported() {
        // given
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("text/plain");

        // when / then
        assertThatThrownBy(() -> cloudinaryStorageService.uploadFile(file, "folder"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Only image and PDF files are allowed");
    }

    // --- CASE 3: Kiểm tra cấu hình Cloudinary ---

    @Test
    void should_ThrowException_When_CloudinaryIsNotConfigured() {
        // given
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/png");

        mockConfiguration(null, "test-key", "test-secret", null);

        // when / then
        assertThatThrownBy(() -> cloudinaryStorageService.uploadFile(file, "folder"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Cloudinary is not configured");
    }

    // --- CASE 4: Kiểm tra tên thư mục không hợp lệ ---

    @Test
    void should_ThrowException_When_FolderContainsUnsupportedCharacters() {
        // given
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/png");

        mockConfiguration("test-cloud", "test-key", "test-secret", "mealmate/uploads");

        // when / then
        assertThatThrownBy(() -> cloudinaryStorageService.uploadFile(file, "invalid*folder!"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Upload folder contains unsupported characters");
    }
}
