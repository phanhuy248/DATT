package com.example.demo.service;

import com.example.demo.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class UploadService {

    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public String saveFile(MultipartFile file, String subFolder) {
        if (file == null || file.isEmpty()) return null;
        validateImage(file);
        try {
            Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path dir = root.resolve(subFolder).normalize();
            if (!dir.startsWith(root)) {
                throw new BadRequestException("Thu muc upload khong hop le");
            }
            Files.createDirectories(dir);

            String extension = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + "." + extension;
            Path target = dir.resolve(filename).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            return subFolder + "/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Khong the luu file: " + e.getMessage());
        }
    }

    private void validateImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File rong");
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new BadRequestException("Anh khong duoc vuot qua 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Chi ho tro anh JPG, PNG, WEBP");
        }
        String extension = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Chi ho tro anh JPG, PNG, WEBP");
        }
    }

    private String getExtension(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            throw new BadRequestException("Ten file khong hop le");
        }
        String fileName = Paths.get(originalName).getFileName().toString();
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            throw new BadRequestException("File phai co duoi .jpg, .jpeg, .png hoac .webp");
        }
        String extension = fileName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
        List<String> forbiddenExtensions = List.of("exe", "svg", "html", "js");
        if (forbiddenExtensions.contains(extension)) {
            throw new BadRequestException("Dinh dang file khong duoc phep");
        }
        return extension;
    }
}
