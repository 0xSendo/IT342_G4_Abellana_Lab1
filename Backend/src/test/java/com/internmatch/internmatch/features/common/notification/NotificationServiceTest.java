package com.internmatch.internmatch.features.common.notification;

import com.internmatch.internmatch.features.auth.Role;
import com.internmatch.internmatch.features.auth.User;
import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Epic("Notifications")
@Feature("Notification Workflow")
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    private NotificationService service;
    private User student;
    private User otherUser;

    @BeforeEach
    void setUp() {
        service = new NotificationService(notificationRepository);
        student = User.builder()
                .id(1L).email("student@internmatch.com").name("Student").role(Role.STUDENT).tokenVersion(0).build();
        otherUser = User.builder()
                .id(99L).email("hacker@internmatch.com").name("Intruder").role(Role.STUDENT).tokenVersion(0).build();
    }

    private Notification notification(Long id, User owner) {
        return Notification.builder()
                .id(id)
                .user(owner)
                .title("Application update")
                .message("Your application moved to SHORTLISTED")
                .type("STATUS_UPDATE")
                .relatedId(5L)
                .build();
    }

    @Test
    @DisplayName("createNotification persists title, message, type and relatedId")
    void createNotificationPersistsFields() {
        service.createNotification(student, "New application", "Someone applied to your posting", "APPLICATION", 5L);

        verify(notificationRepository).save(argThat(n ->
                n.getUser().getId().equals(1L)
                        && "New application".equals(n.getTitle())
                        && "Someone applied to your posting".equals(n.getMessage())
                        && "APPLICATION".equals(n.getType())
                        && n.getRelatedId().equals(5L)
                        && !n.isRead()));
    }

    @Test
    @DisplayName("getUserNotifications returns the user's notifications, newest first")
    void getUserNotificationsReturnsOrderedList() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(notification(2L, student), notification(1L, student)));

        List<Notification> result = service.getUserNotifications(1L);

        assertEquals(2, result.size());
        assertEquals(2L, result.get(0).getId());
        assertEquals(1L, result.get(1).getId());
    }

    @Test
    @DisplayName("markAsRead flips read flag on an owned notification")
    void markAsReadOnOwnedNotification() {
        Notification owned = notification(10L, student);
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(owned));

        service.markAsRead(10L, 1L);

        assertTrue(owned.isRead());
        verify(notificationRepository).findById(10L);
    }

    @Test
    @DisplayName("markAsRead denies notifications owned by another user")
    void markAsReadDeniedForForeignNotification() {
        Notification ownedByOther = notification(10L, otherUser);
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(ownedByOther));

        assertThrows(AccessDeniedException.class, () -> service.markAsRead(10L, 1L));
        assertFalse(ownedByOther.isRead());
    }

    @Test
    @DisplayName("markAsRead denies missing notifications")
    void markAsReadDeniedForMissingNotification() {
        when(notificationRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(AccessDeniedException.class, () -> service.markAsRead(404L, 1L));
    }

    @Test
    @DisplayName("markAllAsRead flips the read flag on every returned notification")
    void markAllAsReadFlipsEveryNotification() {
        Notification a = notification(1L, student);
        Notification b = notification(2L, student);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(a, b));

        service.markAllAsRead(1L);

        assertTrue(a.isRead());
        assertTrue(b.isRead());
    }

    @Test
    @DisplayName("deleteNotification removes only owned notifications")
    void deleteNotificationRemovesOwned() {
        Notification owned = notification(10L, student);
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(owned));

        service.deleteNotification(10L, 1L);

        verify(notificationRepository).delete(owned);
    }

    @Test
    @DisplayName("deleteNotification denies foreign notifications")
    void deleteNotificationDeniedForForeignNotification() {
        Notification ownedByOther = notification(10L, otherUser);
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(ownedByOther));

        assertThrows(AccessDeniedException.class, () -> service.deleteNotification(10L, 1L));
        verify(notificationRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteAllNotifications purges every notification for the user")
    void deleteAllNotificationsPurgesByUser() {
        service.deleteAllNotifications(1L);

        verify(notificationRepository).deleteByUserId(1L);
    }
}