package com.internmatch.internmatch.features.common.community;

import com.internmatch.internmatch.features.auth.Role;
import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.common.exception.ResourceNotFoundException;
import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Epic("Community")
@Feature("Community Posts")
class CommunityPostServiceTest {

    @Mock
    private CommunityPostRepository repository;
    @Mock
    private ContentModerationService moderationService;

    private CommunityPostService service;

    private User student;
    private User otherStudent;

    @BeforeEach
    void setUp() {
        service = new CommunityPostService(repository, moderationService);

        student = User.builder()
                .id(1L).email("alice@internmatch.com").name("Alice").role(Role.STUDENT).tokenVersion(0).build();
        otherStudent = User.builder()
                .id(2L).email("bob@internmatch.com").name("Bob").role(Role.STUDENT).tokenVersion(0).build();
    }

    private CommunityPost post(User author, String content, Long id) {
        return CommunityPost.builder()
                .id(id)
                .student(author)
                .content(content)
                .type("GENERAL_UPDATE")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @Story("Create Post")
    class CreatePost {

        @Test
        @DisplayName("Validates content through moderation before saving")
        void validatesContentFirst() {
            CommunityPost newPost = post(student, "My first post", null);
            when(repository.findByStudentId(1L)).thenReturn(Optional.empty());
            when(repository.save(any(CommunityPost.class))).thenAnswer(inv -> {
                CommunityPost p = inv.getArgument(0);
                p.setId(10L);
                return p;
            });

            CommunityPost result = service.createPost(newPost);

            verify(moderationService).validateContent("My first post");
            assertEquals(10L, result.getId());
        }

        @Test
        @DisplayName("Enforces one-post-per-student limit")
        void enforcesOnePerStudent() {
            CommunityPost existing = post(student, "Existing post", 5L);
            CommunityPost newPost = post(student, "New post attempt", null);
            when(repository.findByStudentId(1L)).thenReturn(Optional.of(existing));

            CommunityException ex = assertThrows(CommunityException.class,
                    () -> service.createPost(newPost));
            assertTrue(ex.getMessage().contains("already posted"));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Moderation failure propagates exception")
        void moderationFailurePropagates() {
            CommunityPost newPost = post(student, "Bad content", null);
            doThrow(new RuntimeException("MODERATION_ERROR: Profanity detected"))
                    .when(moderationService).validateContent("Bad content");

            assertThrows(RuntimeException.class, () -> service.createPost(newPost));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Saves and returns new post on success")
        void savesAndReturns() {
            CommunityPost newPost = post(student, "Hello world", null);
            when(repository.findByStudentId(1L)).thenReturn(Optional.empty());
            when(repository.save(any(CommunityPost.class))).thenAnswer(inv -> {
                CommunityPost p = inv.getArgument(0);
                p.setId(10L);
                return p;
            });

            CommunityPost result = service.createPost(newPost);

            assertEquals(10L, result.getId());
            assertEquals("Hello world", result.getContent());
        }
    }

    @Nested
    @Story("Delete Post")
    class DeletePost {

        @Test
        @DisplayName("Owner can delete their own post")
        void ownerDeletes() {
            CommunityPost owned = post(student, "My post", 5L);
            when(repository.findById(5L)).thenReturn(Optional.of(owned));

            assertDoesNotThrow(() -> service.deletePost(5L, 1L));
            verify(repository).delete(owned);
        }

        @Test
        @DisplayName("Non-owner cannot delete")
        void nonOwnerDenied() {
            CommunityPost owned = post(student, "My post", 5L);
            when(repository.findById(5L)).thenReturn(Optional.of(owned));

            assertThrows(AccessDeniedException.class, () -> service.deletePost(5L, 2L));
            verify(repository, never()).delete(any());
        }

        @Test
        @DisplayName("Throws for missing post")
        void throwsForMissingPost() {
            when(repository.findById(99L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.deletePost(99L, 1L));
        }
    }

    @Nested
    @Story("Update Post")
    class UpdatePost {

        @Test
        @DisplayName("Owner can update their post content")
        void ownerUpdates() {
            CommunityPost owned = post(student, "Old content", 5L);
            when(repository.findById(5L)).thenReturn(Optional.of(owned));
            when(repository.save(any(CommunityPost.class))).thenAnswer(inv -> inv.getArgument(0));

            CommunityPost result = service.updatePost(5L, 1L, "New content");

            verify(moderationService).validateContent("New content");
            assertEquals("New content", result.getContent());
        }

        @Test
        @DisplayName("Non-owner cannot update")
        void nonOwnerDenied() {
            CommunityPost owned = post(student, "Old content", 5L);
            when(repository.findById(5L)).thenReturn(Optional.of(owned));

            assertThrows(AccessDeniedException.class, () -> service.updatePost(5L, 2L, "Hacked"));
        }

        @Test
        @DisplayName("Moderation is checked on new content before persistence")
        void moderationCheckedFirst() {
            doThrow(new RuntimeException("MODERATION_ERROR"))
                    .when(moderationService).validateContent("Bad update");

            assertThrows(RuntimeException.class, () -> service.updatePost(5L, 1L, "Bad update"));
            verify(repository, never()).findById(any());
        }

        @Test
        @DisplayName("Throws for missing post")
        void throwsForMissingPost() {
            when(repository.findById(99L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.updatePost(99L, 1L, "New"));
        }
    }

    @Nested
    @Story("Admin Operations")
    class AdminOperations {

        @Test
        @DisplayName("Admin can update any post without ownership check")
        void adminUpdates() {
            CommunityPost otherPost = post(otherStudent, "Bob's post", 5L);
            when(repository.findById(5L)).thenReturn(Optional.of(otherPost));
            when(repository.save(any(CommunityPost.class))).thenAnswer(inv -> inv.getArgument(0));

            CommunityPost result = service.updatePostAdmin(5L, "Admin edited");

            verify(moderationService).validateContent("Admin edited");
            assertEquals("Admin edited", result.getContent());
        }

        @Test
        @DisplayName("Admin can delete any post")
        void adminDeletes() {
            assertDoesNotThrow(() -> service.deletePostAdmin(5L));
            verify(repository).deleteById(5L);
        }
    }

    @Nested
    @Story("Query Operations")
    class QueryOperations {

        @Test
        @DisplayName("getAllPosts returns newest first")
        void getAllPostsNewestFirst() {
            CommunityPost p1 = post(student, "Post 1", 1L);
            CommunityPost p2 = post(student, "Post 2", 2L);
            when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(p2, p1));

            List<CommunityPost> result = service.getAllPosts();

            assertEquals(2, result.size());
            assertEquals(2L, result.get(0).getId());
        }

        @Test
        @DisplayName("findByStudentId returns Optional")
        void findByStudentId() {
            CommunityPost existing = post(student, "Post", 5L);
            when(repository.findByStudentId(1L)).thenReturn(Optional.of(existing));

            Optional<CommunityPost> result = service.findByStudentId(1L);

            assertTrue(result.isPresent());
            assertEquals(5L, result.get().getId());
        }

        @Test
        @DisplayName("deleteAllPosts calls deleteAll and flush")
        void deleteAllPosts() {
            assertDoesNotThrow(() -> service.deleteAllPosts());
            verify(repository).deleteAll();
            verify(repository).flush();
        }
    }
}
