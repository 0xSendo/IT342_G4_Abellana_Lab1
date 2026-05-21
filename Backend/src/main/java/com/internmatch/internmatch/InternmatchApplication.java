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
            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                User admin = User.builder()
                        .name("AdminPaul")
                        .email(adminEmail)
                        .password(passwordEncoder.encode(System.getenv("ADMIN_PASSWORD") != null ? System.getenv("ADMIN_PASSWORD") : "ChangeMe123!"))
                        .role(Role.ADMIN)
                        .department("System Administration")
                        .build();
                userRepository.save(admin);
                System.out.println("========================================");
                System.out.println("ADMIN ACCOUNT CREATED SUCCESSFULLY");
                System.out.println("Email: " + adminEmail);
                System.out.println("Password: [PROTECTED]");
                System.out.println("========================================");
            }
        };
    }
}
