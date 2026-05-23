package com.example.demo.controller;

import com.example.demo.domain.User;
import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.user.UpdateProfileRequest;
import com.example.demo.dto.user.UserDTO;
import com.example.demo.dto.user.UserRequest;
import com.example.demo.service.UploadService;
import com.example.demo.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UploadService uploadService;

    public UserController(UserService userService, UploadService uploadService) {
        this.userService = userService;
        this.uploadService = uploadService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(UserDTO.from(user)));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest req) {
        User user = userService.findByEmail(userDetails.getUsername());
        user.setFullName(req.getFullName());
        user.setAddress(req.getAddress());
        user.setPhone(req.getPhone());
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thành công", UserDTO.from(userService.save(user))));
    }

    @PostMapping("/me/avatar")
    public ResponseEntity<ApiResponse<UserDTO>> uploadAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        User user = userService.findByEmail(userDetails.getUsername());
        String avatarPath = uploadService.saveFile(file, "avatars");
        user.setAvatar(avatarPath);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật ảnh đại diện thành công",
                UserDTO.from(userService.save(user))));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers().stream()
                .map(UserDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable long id) {
        User user = userService.findById(id);
        if (user == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(UserDTO.from(user)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> createUser(@Valid @RequestBody UserRequest req) {
        return ResponseEntity.status(201).body(ApiResponse.ok("Tạo tài khoản thành công",
                UserDTO.from(userService.createByAdmin(req))));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(@PathVariable long id,
                                                           @Valid @RequestBody UserRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật tài khoản thành công",
                UserDTO.from(userService.updateByAdmin(id, req))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable long id) {
        userService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa người dùng thành công", null));
    }
}
