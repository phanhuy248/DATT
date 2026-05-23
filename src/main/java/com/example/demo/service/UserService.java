package com.example.demo.service;

import com.example.demo.domain.Role;
import com.example.demo.domain.User;
import com.example.demo.dto.auth.RegisterRequest;
import com.example.demo.dto.user.UserRequest;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(RegisterRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.getEmail())) {
            throw new IllegalArgumentException("Email đã được sử dụng");
        }
        User user = new User();
        user.setEmail(req.getEmail().trim().toLowerCase(Locale.ROOT));
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setFullName(req.getFullName());
        user.setAddress(req.getAddress());
        user.setPhone(req.getPhone());
        user.setRole(roleRepository.findByName("USER"));
        return userRepository.save(user);
    }

    @Transactional
    public User registerVerified(String email, String passwordHash, String fullName, String address, String phone) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email da duoc su dung");
        }

        User user = new User();
        user.setEmail(email.trim().toLowerCase(Locale.ROOT));
        user.setPassword(passwordHash);
        user.setFullName(fullName);
        user.setAddress(address);
        user.setPhone(phone);
        Role role = roleRepository.findByName("USER");
        if (role == null) {
            role = new Role();
            role.setName("USER");
            role.setDescription("User");
            role = roleRepository.save(role);
        }
        user.setRole(role);
        user.setActive(true);
        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email);
    }

    public User findById(long id) {
        return userRepository.findById(id).orElse(null);
    }

    public List<User> getAllUsers() {
        return userRepository.findByActiveTrue();
    }

    public Page<User> getAllUsersPaged(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }

    @Transactional
    public void deleteById(Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user != null) {
            user.setActive(false);
            userRepository.save(user);
        }
    }

    public boolean checkEmailExist(String email) {
        return userRepository.existsByEmailIgnoreCase(email);
    }

    public long countUsers() {
        return userRepository.count();
    }

    public Role getRoleByName(String name) {
        return roleRepository.findByName(name);
    }

    @Transactional
    public User createByAdmin(UserRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.getEmail())) {
            throw new IllegalArgumentException("Email đã được sử dụng");
        }
        if (req.getPassword() == null || req.getPassword().isBlank()) {
            throw new IllegalArgumentException("Mật khẩu không được để trống");
        }
        User user = new User();
        user.setEmail(req.getEmail().trim().toLowerCase(Locale.ROOT));
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        applyUserRequest(user, req);
        return userRepository.save(user);
    }

    @Transactional
    public User updateByAdmin(long id, UserRequest req) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        if (!user.getEmail().equalsIgnoreCase(req.getEmail()) && userRepository.existsByEmailIgnoreCase(req.getEmail())) {
            throw new IllegalArgumentException("Email đã được sử dụng");
        }
        user.setEmail(req.getEmail().trim().toLowerCase(Locale.ROOT));
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        applyUserRequest(user, req);
        return userRepository.save(user);
    }

    private void applyUserRequest(User user, UserRequest req) {
        user.setFullName(req.getFullName());
        user.setAddress(req.getAddress());
        user.setPhone(req.getPhone());
        user.setActive(req.isActive());
        Role role = roleRepository.findByName(req.getRole());
        if (role == null) {
            throw new IllegalArgumentException("Vai trò không hợp lệ");
        }
        user.setRole(role);
    }
}
