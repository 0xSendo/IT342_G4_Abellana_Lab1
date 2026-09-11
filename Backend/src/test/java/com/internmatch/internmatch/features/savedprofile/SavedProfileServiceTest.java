package com.internmatch.internmatch.features.savedprofile;

import com.internmatch.internmatch.features.auth.Role;
import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Epic("Talent Discovery")
@Feature("Saved Profiles")
class SavedProfileServiceTest {

    @Mock
    private SavedProfileRepository savedProfileRepository;
    @Mock
    private UserRepository userRepository;

    private SavedProfileService service;

    private User employer;
    private User student;

    @BeforeEach
    void setUp() {
        service = new SavedProfileService(savedProfileRepository, userRepository);

        employer = User.builder()
                .id(1L).email("hr@acme.com").name("ACME HR").role(Role.EMPLOYER).tokenVersion(0)
                .companyName("ACME Corp").build();
        student = User.builder()
                .id(2L).email("alice@internmatch.com").name("Alice").role(Role.STUDENT).tokenVersion(0)
                .program("BS Computer Science").yearLevel("3rd Year").skills("Java, React")
                .bio("Passionate developer").projects("E-commerce platform").build();
    }

    private SavedProfile savedProfile(User emp, User stu) {
        return SavedProfile.builder()
                .id(10L)
                .employer(emp)
                .student(stu)
                .savedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @Story("Save Profile")
    class SaveProfile {

        @Test
        @DisplayName("Creates a saved profile successfully")
        void savesProfile() {
            when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));
            when(userRepository.findById(2L)).thenReturn(Optional.of(student));
            when(savedProfileRepository.findByEmployerIdAndStudentId(1L, 2L)).thenReturn(Optional.empty());
            when(savedProfileRepository.save(any(SavedProfile.class))).thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> service.saveProfile("hr@acme.com", 2L));
            verify(savedProfileRepository).save(any(SavedProfile.class));
        }

        @Test
        @DisplayName("Idempotent — silently returns when already saved")
        void idempotentSave() {
            when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));
            when(userRepository.findById(2L)).thenReturn(Optional.of(student));
            when(savedProfileRepository.findByEmployerIdAndStudentId(1L, 2L))
                    .thenReturn(Optional.of(savedProfile(employer, student)));

            assertDoesNotThrow(() -> service.saveProfile("hr@acme.com", 2L));
            verify(savedProfileRepository, never()).save(any());
        }

        @Test
        @DisplayName("Throws when employer not found")
        void throwsWhenEmployerNotFound() {
            when(userRepository.findByEmail("unknown@acme.com")).thenReturn(Optional.empty());

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.saveProfile("unknown@acme.com", 2L));
            assertEquals("Employer not found", ex.getMessage());
        }

        @Test
        @DisplayName("Throws when student not found")
        void throwsWhenStudentNotFound() {
            when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.saveProfile("hr@acme.com", 99L));
            assertEquals("Student not found", ex.getMessage());
        }
    }

    @Nested
    @Story("Unsave Profile")
    class UnsaveProfile {

        @Test
        @DisplayName("Deletes the saved profile pair")
        void deletesSavedProfile() {
            when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));

            assertDoesNotThrow(() -> service.unsaveProfile("hr@acme.com", 2L));
            verify(savedProfileRepository).deleteByEmployerIdAndStudentId(1L, 2L);
        }

        @Test
        @DisplayName("Throws when employer not found")
        void throwsWhenEmployerNotFound() {
            when(userRepository.findByEmail("unknown@acme.com")).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> service.unsaveProfile("unknown@acme.com", 2L));
        }
    }

    @Nested
    @Story("Get Saved Profiles")
    class GetSavedProfiles {

        @Test
        @DisplayName("Returns mapped DTO list for employer")
        void returnsDtoList() {
            when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));
            when(savedProfileRepository.findByEmployerId(1L))
                    .thenReturn(List.of(savedProfile(employer, student)));

            List<SavedProfileDto> result = service.getSavedProfiles("hr@acme.com");

            assertEquals(1, result.size());
            assertEquals(2L, result.get(0).getStudentId());
            assertEquals("Alice", result.get(0).getStudentName());
            assertEquals("alice@internmatch.com", result.get(0).getStudentEmail());
            assertEquals("BS Computer Science", result.get(0).getStudentProgram());
            assertEquals("3rd Year", result.get(0).getStudentYearLevel());
            assertEquals("Java, React", result.get(0).getStudentSkills());
            assertEquals("Passionate developer", result.get(0).getStudentBio());
            assertEquals("E-commerce platform", result.get(0).getStudentProjects());
        }

        @Test
        @DisplayName("Returns empty list when no saved profiles")
        void returnsEmptyList() {
            when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));
            when(savedProfileRepository.findByEmployerId(1L)).thenReturn(List.of());

            List<SavedProfileDto> result = service.getSavedProfiles("hr@acme.com");

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @Story("Check If Profile Saved")
    class IsProfileSaved {

        @Test
        @DisplayName("Returns true when profile is saved")
        void returnsTrue() {
            when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));
            when(savedProfileRepository.findByEmployerIdAndStudentId(1L, 2L))
                    .thenReturn(Optional.of(savedProfile(employer, student)));

            assertTrue(service.isProfileSaved("hr@acme.com", 2L));
        }

        @Test
        @DisplayName("Returns false when profile is not saved")
        void returnsFalse() {
            when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));
            when(savedProfileRepository.findByEmployerIdAndStudentId(1L, 2L)).thenReturn(Optional.empty());

            assertFalse(service.isProfileSaved("hr@acme.com", 2L));
        }
    }
}
