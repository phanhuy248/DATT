package com.smartshop.demo.controller;

import com.smartshop.demo.domain.ContactMessage;
import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.exception.ResourceNotFoundException;
import com.smartshop.demo.repository.ContactMessageRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {
    private final ContactMessageRepository contactRepository;

    public ContactController(ContactMessageRepository contactRepository) {
        this.contactRepository = contactRepository;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ContactMessage>> create(@Valid @RequestBody ContactMessage message) {
        return ResponseEntity.status(201).body(ApiResponse.ok("Gửi liên hệ thành công", contactRepository.save(message)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ContactMessage>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(contactRepository.findAllByOrderByCreatedAtDesc()));
    }

    @PutMapping("/{id}/handled")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ContactMessage>> markHandled(@PathVariable long id) {
        ContactMessage message = contactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy liên hệ"));
        message.setHandled(true);
        return ResponseEntity.ok(ApiResponse.ok("Đã xử lý liên hệ", contactRepository.save(message)));
    }
}
