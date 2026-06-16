package com.smartshop.demo.dto.user;

import com.smartshop.demo.domain.User;

public class UserDTO {
    private long id;
    private String email;
    private String fullName;
    private String address;
    private String phone;
    private String avatar;
    private String role;
    private boolean active;

    public static UserDTO from(User u) {
        UserDTO dto = new UserDTO();
        dto.id = u.getId();
        dto.email = u.getEmail();
        dto.fullName = u.getFullName();
        dto.address = u.getAddress();
        dto.phone = u.getPhone();
        dto.avatar = u.getAvatar();
        dto.role = u.getRole() != null ? u.getRole().getName() : null;
        dto.active = u.isActive();
        return dto;
    }

    public long getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getAddress() { return address; }
    public String getPhone() { return phone; }
    public String getAvatar() { return avatar; }
    public String getRole() { return role; }
    public boolean isActive() { return active; }
}
