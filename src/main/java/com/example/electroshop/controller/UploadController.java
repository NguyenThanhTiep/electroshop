package com.example.electroshop.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "http://localhost:5173")
public class UploadController {

    private final Path uploadDir = Paths.get(
            System.getProperty("user.dir"),
            "uploads"
    ).toAbsolutePath().normalize();

    @PostMapping
    public ResponseEntity<String> uploadFile(
            @RequestParam("file") MultipartFile file
    ) {
        try {
            // 1. Kiểm tra file có tồn tại hay không
            if (file == null || file.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body("File rỗng");
            }

            // 2. Lấy tên file ban đầu
            String originalFilename = file.getOriginalFilename();

            if (originalFilename == null ||
                    originalFilename.isBlank() ||
                    !originalFilename.contains(".")) {

                return ResponseEntity
                        .badRequest()
                        .body("Tên file không hợp lệ");
            }

            // 3. Đưa tên file về chữ thường
            String lowerName = originalFilename.toLowerCase(
                    Locale.ROOT
            );

            // 4. Kiểm tra định dạng ảnh
            if (!lowerName.endsWith(".png") &&
                    !lowerName.endsWith(".jpg") &&
                    !lowerName.endsWith(".jpeg") &&
                    !lowerName.endsWith(".webp")) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "Chỉ cho phép ảnh png, jpg, jpeg, webp"
                        );
            }

            // 5. Lấy phần mở rộng của file
            String extension = lowerName.substring(
                    lowerName.lastIndexOf(".")
            );

            // 6. Tạo tên file mới để tránh trùng
            String fileName =
                    UUID.randomUUID() + extension;

            // 7. Tự động tạo thư mục uploads nếu chưa có
            Files.createDirectories(uploadDir);

            // 8. Tạo đường dẫn đích
            Path destination = uploadDir
                    .resolve(fileName)
                    .normalize();

            /*
             * Kiểm tra bảo mật:
             * Không cho file được lưu ra ngoài thư mục uploads.
             */
            if (!destination.startsWith(uploadDir)) {
                return ResponseEntity
                        .badRequest()
                        .body("Đường dẫn file không hợp lệ");
            }

            // 9. Lưu file vào thư mục uploads
            Files.copy(
                    file.getInputStream(),
                    destination,
                    StandardCopyOption.REPLACE_EXISTING
            );

            // In ra Terminal để kiểm tra vị trí lưu
            System.out.println(
                    "Ảnh đã được lưu tại: "
                            + destination
            );

            // 10. Trả URL ảnh về frontend
            String imageUrl =
                    "http://localhost:8080/uploads/"
                            + fileName;

            return ResponseEntity.ok(imageUrl);

        } catch (IOException e) {
            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            "Không thể lưu ảnh: "
                                    + e.getMessage()
                    );
        }
    }
}