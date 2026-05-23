package com.example.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class UploadService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public String saveFile(MultipartFile file, String subFolder) {
        if (file == null || file.isEmpty()) return null;
        try {
            Path dir = Paths.get(uploadDir, subFolder);
            Files.createDirectories(dir);

            // Lấy tên gốc, fallback về "file" nếu null
            String originalName = file.getOriginalFilename();
            if (originalName == null || originalName.isBlank()) originalName = "file";

            // Chỉ giữ tên file (bỏ path nếu có), rồi thay thế ký tự đặc biệt và space thành _
            String baseName = Paths.get(originalName).getFileName().toString();
            String safeName = baseName.replaceAll("[^a-zA-Z0-9._-]", "_");

            String filename = System.currentTimeMillis() + "_" + safeName;
            Path target = dir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            // Trả về path với forward slash để nhất quán trên mọi OS
            return subFolder + "/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu file: " + e.getMessage());
        }
    }
}
