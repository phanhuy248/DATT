package com.example.demo.service;

import com.example.demo.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UploadServiceTest {
    @TempDir
    Path uploadDir;

    @Test
    void saveFileUsesUuidNameAndAllowsOnlyImages() {
        UploadService uploadService = new UploadService();
        ReflectionTestUtils.setField(uploadService, "uploadDir", uploadDir.toString());
        MockMultipartFile image = new MockMultipartFile(
                "file", "avatar.png", "image/png", new byte[] {1, 2, 3});

        String savedPath = uploadService.saveFile(image, "avatars");

        assertTrue(savedPath.startsWith("avatars/"));
        assertTrue(savedPath.endsWith(".png"));
        assertNotEquals("avatars/avatar.png", savedPath);
    }

    @Test
    void saveFileRejectsExecutableUpload() {
        UploadService uploadService = new UploadService();
        ReflectionTestUtils.setField(uploadService, "uploadDir", uploadDir.toString());
        MockMultipartFile executable = new MockMultipartFile(
                "file", "virus.exe", "application/octet-stream", new byte[] {1, 2, 3});

        assertThrows(BadRequestException.class,
                () -> uploadService.saveFile(executable, "avatars"));
    }
}
