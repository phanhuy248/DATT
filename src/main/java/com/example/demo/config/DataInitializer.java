package com.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.demo.domain.Role;
import com.example.demo.domain.User;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.DataSeedService;

@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final DataSeedService dataSeedService;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${app.demo-users.enabled:true}")
    private boolean demoUsersEnabled;

    public DataInitializer(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder,
                           DataSeedService dataSeedService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.dataSeedService = dataSeedService;
    }

    @Override
    public void run(ApplicationArguments args) {
        initRoles();
        initUsers();
        if (seedEnabled) {
            dataSeedService.seedProducts();
        } else {
            log.info("[Seed] Product seeding is disabled (app.seed.enabled=false).");
        }
    }

    private void initRoles() {
        if (this.roleRepository.findByName("ADMIN") == null) {
            Role adminRole = new Role();
            adminRole.setName("ADMIN");
            adminRole.setDescription("Administrator");
            this.roleRepository.save(adminRole);
        }
        if (this.roleRepository.findByName("USER") == null) {
            Role userRole = new Role();
            userRole.setName("USER");
            userRole.setDescription("User");
            this.roleRepository.save(userRole);
        }
        if (this.roleRepository.findByName("STAFF") == null) {
            Role staffRole = new Role();
            staffRole.setName("STAFF");
            staffRole.setDescription("Staff");
            this.roleRepository.save(staffRole);
        }
    }

    private void initUsers() {
        if (!demoUsersEnabled) {
            log.info("[Init] Demo users are disabled (app.demo-users.enabled=false).");
            return;
        }
        if (!this.userRepository.existsByEmail("admin@gmail.com")) {
            User admin = new User();
            admin.setEmail("admin@gmail.com");
            admin.setPassword(this.passwordEncoder.encode("123456"));
            admin.setFullName("Administrator");
            admin.setAddress("Hà Nội");
            admin.setPhone("0900000000");
            admin.setRole(this.roleRepository.findByName("ADMIN"));
            this.userRepository.save(admin);
            log.info("[Init] Created demo admin user admin@gmail.com");
        }

        if (!this.userRepository.existsByEmail("user@gmail.com")) {
            User user = new User();
            user.setEmail("user@gmail.com");
            user.setPassword(this.passwordEncoder.encode("123456"));
            user.setFullName("Người dùng");
            user.setAddress("Hồ Chí Minh");
            user.setPhone("0900000001");
            user.setRole(this.roleRepository.findByName("USER"));
            this.userRepository.save(user);
            log.info("[Init] Created demo customer user user@gmail.com");
        }
    }
}
