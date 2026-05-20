package com.internmatch.internmatch.features.auth;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = true)
    private String password;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column
    private String program;

    @Column
    private String yearLevel;

    @Column(length = 1000)
    private String skills;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(columnDefinition = "TEXT")
    private String projects;

    @Column(length = 2000)
    @com.fasterxml.jackson.annotation.JsonProperty("resumeUrl")
    private String resumeUrl;

    @Column(length = 2000)
    @com.fasterxml.jackson.annotation.JsonProperty("linkedin")
    private String linkedin;

    @Column(length = 2000)
    @com.fasterxml.jackson.annotation.JsonProperty("website")
    private String website;

    @Column
    private String companyName;

    @Column
    private String companyLocation;

    @Column
    private String companyWebsite;

    @Column
    private String department;

    @Column
    private String phone;

    // Spring Security UserDetails methods
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
