package com.internmatch.internmatch.features.auth;

import com.internmatch.internmatch.features.common.community.CommunityPostRepository;
import com.internmatch.internmatch.features.common.notification.NotificationRepository;
import com.internmatch.internmatch.features.connection.ConnectionRepository;
import com.internmatch.internmatch.features.internship.ApplicationRepository;
import com.internmatch.internmatch.features.internship.InternshipRepository;
import com.internmatch.internmatch.features.savedprofile.SavedProfileRepository;
import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Epic("Administration")
@Feature("User Lifecycle")
class UserCleanupServiceTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private CommunityPostRepository communityPostRepository;
    @Mock
    private ConnectionRepository connectionRepository;
    @Mock
    private SavedProfileRepository savedProfileRepository;
    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private InternshipRepository internshipRepository;
    @Mock
    private UserRepository userRepository;

    private UserCleanupService service;

    @BeforeEach
    void setUp() {
        service = new UserCleanupService(
                notificationRepository, communityPostRepository, connectionRepository,
                savedProfileRepository, applicationRepository, internshipRepository, userRepository);
    }

    @Test
    @DisplayName("Deletes all user data in correct FK-safe order")
    void deletesInCorrectOrder() {
        service.deleteUserWithData(1L);

        InOrder inOrder = inOrder(
                notificationRepository, communityPostRepository, connectionRepository,
                savedProfileRepository, applicationRepository, internshipRepository, userRepository);

        inOrder.verify(notificationRepository).deleteByUserId(1L);
        inOrder.verify(communityPostRepository).deleteByStudentId(1L);
        inOrder.verify(connectionRepository).deleteByRequesterIdOrReceiverId(1L);
        inOrder.verify(savedProfileRepository).deleteByEmployerIdOrStudentId(1L);
        inOrder.verify(applicationRepository).deleteByStudentId(1L);
        inOrder.verify(applicationRepository).deleteByInternshipPostedById(1L);
        inOrder.verify(internshipRepository).deleteByPostedById(1L);
        inOrder.verify(userRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Calls notification delete first")
    void notificationDeleteFirst() {
        service.deleteUserWithData(1L);

        verify(notificationRepository).deleteByUserId(1L);
    }

    @Test
    @DisplayName("Calls community post delete after notifications")
    void communityDeleteAfterNotifications() {
        service.deleteUserWithData(1L);

        verify(communityPostRepository).deleteByStudentId(1L);
    }

    @Test
    @DisplayName("Calls connection delete for either role")
    void connectionDeleteEitherRole() {
        service.deleteUserWithData(1L);

        verify(connectionRepository).deleteByRequesterIdOrReceiverId(1L);
    }

    @Test
    @DisplayName("Calls saved profile delete for either role")
    void savedProfileDeleteEitherRole() {
        service.deleteUserWithData(1L);

        verify(savedProfileRepository).deleteByEmployerIdOrStudentId(1L);
    }

    @Test
    @DisplayName("Calls both application deletes (student + internship owner)")
    void bothApplicationDeletes() {
        service.deleteUserWithData(1L);

        verify(applicationRepository).deleteByStudentId(1L);
        verify(applicationRepository).deleteByInternshipPostedById(1L);
    }

    @Test
    @DisplayName("Calls internship delete before user delete")
    void internshipDeleteBeforeUser() {
        InOrder inOrder = inOrder(internshipRepository, userRepository);

        service.deleteUserWithData(1L);

        inOrder.verify(internshipRepository).deleteByPostedById(1L);
        inOrder.verify(userRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Calls user delete last")
    void userDeleteLast() {
        service.deleteUserWithData(1L);

        verify(userRepository).deleteById(1L);
    }
}
