package com.internmatch.internmatch.features.common.notification;

import com.internmatch.internmatch.features.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void createNotification(User user, String title, String message, String type, Long relatedId) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .relatedId(relatedId)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = findOwnedNotification(notificationId, userId);
        notification.setRead(true);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).forEach(n -> n.setRead(true));
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = findOwnedNotification(notificationId, userId);
        notificationRepository.delete(notification);
    }

    @Transactional
    public void deleteAllNotifications(Long userId) {
        notificationRepository.deleteByUserId(userId);
    }

    private Notification findOwnedNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Notification not found"));
        if (!notification.getUser().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("You do not have permission to access this notification");
        }
        return notification;
    }
}
