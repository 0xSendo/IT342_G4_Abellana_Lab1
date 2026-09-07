package com.internmatch.internmatch;

import com.internmatch.internmatch.features.auth.Role;
import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class InternmatchApplication {

    public static void main(String[] args) {
        SpringApplication.run(InternmatchApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String adminEmail = "adminpaul@internmatch.com";
            String adminPassword = System.getenv("ADMIN_PASSWORD");
            if (adminPassword == null || adminPassword.isBlank() || "ChangeMe123!".equals(adminPassword)) {
                throw new IllegalStateException("ADMIN_PASSWORD environment variable must be set to a strong value (not the default 'ChangeMe123!').");
            }
            String encoded = passwordEncoder.encode(adminPassword);
            User admin = userRepository.findByEmail(adminEmail).orElseGet(() -> User.builder()
                        .name("AdminPaul")
                        .email(adminEmail)
                        .role(Role.ADMIN)
                        .department("System Administration")
                        .build());
            if (!passwordEncoder.matches(adminPassword, admin.getPassword() != null ? admin.getPassword() : "")) {
                admin.setPassword(encoded);
                userRepository.save(admin);
            }
            if (admin.getId() == null) {
                userRepository.save(admin);
            }
            System.out.println("========================================");
            System.out.println("ADMIN ACCOUNT READY");
            System.out.println("Email: " + adminEmail);
            System.out.println("Password: [PROTECTED]");
            System.out.println("========================================");
        };
    }
}
