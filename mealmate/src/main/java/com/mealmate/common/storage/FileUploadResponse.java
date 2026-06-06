package com.mealmate.common.storage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {

    private String url;

    private String publicId;

    private String resourceType;

    private String contentType;

    private String originalFilename;

    private Long bytes;
}
