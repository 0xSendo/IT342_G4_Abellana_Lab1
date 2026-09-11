package com.internmatch.internmatch.features.connection;

import com.internmatch.internmatch.features.auth.Role;
import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import com.internmatch.internmatch.features.common.notification.NotificationService;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Epic("Networking")
@Feature("Connection Workflow")
class ConnectionServiceTest {

    @Mock
    private ConnectionRepository connectionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;

    private ConnectionService service;

    private User requester;
    private User receiver;

    @BeforeEach
    void setUp() {
        service = new ConnectionService(connectionRepository, userRepository, notificationService);

        requester = User.builder()
                .id(1L).email("alice@internmatch.com").name("Alice").role(Role.STUDENT).tokenVersion(0).build();
        receiver = User.builder()
                .id(2L).email("bob@internmatch.com").name("Bob").role(Role.STUDENT).tokenVersion(0).build();
    }

    private Connection connection(User req, User rec, ConnectionStatus status, Long id) {
        return Connection.builder()
                .id(id)
                .requester(req)
                .receiver(rec)
                .status(status)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @Story("Send Connection Request")
    class SendRequest {

        @Test
        @DisplayName("Creates a pending connection and sends notification")
        void createsPendingConnection() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(connectionRepository.findBetweenUsers(requester, receiver)).thenReturn(Optional.empty());
            when(connectionRepository.save(any(Connection.class))).thenAnswer(inv -> {
                Connection c = inv.getArgument(0);
                c.setId(10L);
                return c;
            });

            Connection result = service.sendRequest(1L, 2L);

            assertEquals(10L, result.getId());
            assertEquals(ConnectionStatus.PENDING, result.getStatus());
            assertEquals(requester, result.getRequester());
            assertEquals(receiver, result.getReceiver());
            verify(notificationService).createNotification(
                    eq(receiver), eq("New Friend Request"), contains("Alice"), eq("CONNECTION_REQUEST"), eq(10L));
        }

        @Test
        @DisplayName("Throws when requester not found")
        void throwsOnMissingRequester() {
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            ConnectionException ex = assertThrows(ConnectionException.class,
                    () -> service.sendRequest(99L, 2L));
            assertEquals("Requester not found", ex.getMessage());
        }

        @Test
        @DisplayName("Throws when receiver not found")
        void throwsOnMissingReceiver() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            ConnectionException ex = assertThrows(ConnectionException.class,
                    () -> service.sendRequest(1L, 99L));
            assertEquals("Receiver not found", ex.getMessage());
        }

        @Test
        @DisplayName("Throws when connection already exists")
        void throwsOnDuplicateConnection() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(connectionRepository.findBetweenUsers(requester, receiver))
                    .thenReturn(Optional.of(connection(requester, receiver, ConnectionStatus.PENDING, 5L)));

            ConnectionException ex = assertThrows(ConnectionException.class,
                    () -> service.sendRequest(1L, 2L));
            assertTrue(ex.getMessage().contains("already exists"));
            verify(connectionRepository, never()).save(any());
        }
    }

    @Nested
    @Story("Respond to Connection Request")
    class RespondToRequest {

        @Test
        @DisplayName("Accepts a pending request and notifies requester")
        void acceptsRequest() {
            Connection pending = connection(requester, receiver, ConnectionStatus.PENDING, 5L);
            when(connectionRepository.findById(5L)).thenReturn(Optional.of(pending));
            when(connectionRepository.save(any(Connection.class))).thenAnswer(inv -> inv.getArgument(0));

            Connection result = service.respondToRequest(5L, 2L, ConnectionStatus.ACCEPTED);

            assertEquals(ConnectionStatus.ACCEPTED, result.getStatus());
            assertNotNull(result.getRespondedAt());
            verify(notificationService).createNotification(
                    eq(requester), contains("Accepted"), contains("Bob"), eq("CONNECTION_ACCEPTED"), eq(5L));
        }

        @Test
        @DisplayName("Declines a pending request without notification")
        void declinesRequest() {
            Connection pending = connection(requester, receiver, ConnectionStatus.PENDING, 5L);
            when(connectionRepository.findById(5L)).thenReturn(Optional.of(pending));
            when(connectionRepository.save(any(Connection.class))).thenAnswer(inv -> inv.getArgument(0));

            Connection result = service.respondToRequest(5L, 2L, ConnectionStatus.DECLINED);

            assertEquals(ConnectionStatus.DECLINED, result.getStatus());
            verify(notificationService, never()).createNotification(any(), anyString(), anyString(), anyString(), any());
        }

        @Test
        @DisplayName("Throws when non-receiver tries to respond")
        void throwsForNonReceiver() {
            Connection pending = connection(requester, receiver, ConnectionStatus.PENDING, 5L);
            when(connectionRepository.findById(5L)).thenReturn(Optional.of(pending));

            ConnectionException ex = assertThrows(ConnectionException.class,
                    () -> service.respondToRequest(5L, 1L, ConnectionStatus.ACCEPTED));
            assertEquals("Unauthorized to respond to this request", ex.getMessage());
        }

        @Test
        @DisplayName("Throws when request already responded to")
        void throwsForAlreadyResponded() {
            Connection accepted = connection(requester, receiver, ConnectionStatus.ACCEPTED, 5L);
            when(connectionRepository.findById(5L)).thenReturn(Optional.of(accepted));

            ConnectionException ex = assertThrows(ConnectionException.class,
                    () -> service.respondToRequest(5L, 2L, ConnectionStatus.DECLINED));
            assertEquals("Request has already been responded to", ex.getMessage());
        }

        @Test
        @DisplayName("Throws when connection not found")
        void throwsForMissingConnection() {
            when(connectionRepository.findById(99L)).thenReturn(Optional.empty());

            ConnectionException ex = assertThrows(ConnectionException.class,
                    () -> service.respondToRequest(99L, 2L, ConnectionStatus.ACCEPTED));
            assertEquals("Connection request not found", ex.getMessage());
        }
    }

    @Nested
    @Story("Get Pending Requests")
    class GetPendingRequests {

        @Test
        @DisplayName("Returns pending requests where user is receiver")
        void returnsPendingInbox() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            Connection req1 = connection(requester, receiver, ConnectionStatus.PENDING, 1L);
            when(connectionRepository.findByReceiverAndStatus(receiver, ConnectionStatus.PENDING))
                    .thenReturn(List.of(req1));

            List<Connection> result = service.getPendingRequests(2L);

            assertEquals(1, result.size());
            assertEquals(1L, result.get(0).getId());
        }

        @Test
        @DisplayName("Throws when user not found")
        void throwsForMissingUser() {
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertThrows(ConnectionException.class, () -> service.getPendingRequests(99L));
        }
    }

    @Nested
    @Story("Get Friends")
    class GetFriends {

        @Test
        @DisplayName("Returns the other party from accepted connections")
        void returnsFriendsFromBothDirections() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            Connection accepted1 = connection(requester, receiver, ConnectionStatus.ACCEPTED, 1L);

            User third = User.builder().id(3L).email("carol@internmatch.com").name("Carol").role(Role.STUDENT).tokenVersion(0).build();
            Connection accepted2 = connection(third, requester, ConnectionStatus.ACCEPTED, 2L);

            when(connectionRepository.findAcceptedConnections(requester))
                    .thenReturn(List.of(accepted1, accepted2));

            List<User> friends = service.getFriends(1L);

            assertEquals(2, friends.size());
            assertTrue(friends.stream().anyMatch(u -> u.getId().equals(2L)));
            assertTrue(friends.stream().anyMatch(u -> u.getId().equals(3L)));
        }

        @Test
        @DisplayName("Returns empty list when no friends")
        void returnsEmptyWhenNoFriends() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(connectionRepository.findAcceptedConnections(requester)).thenReturn(List.of());

            List<User> friends = service.getFriends(1L);

            assertTrue(friends.isEmpty());
        }
    }

    @Nested
    @Story("Get Connection Status")
    class GetConnectionStatus {

        @Test
        @DisplayName("Returns ACCEPTED for accepted connections")
        void returnsAccepted() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(connectionRepository.findBetweenUsers(requester, receiver))
                    .thenReturn(Optional.of(connection(requester, receiver, ConnectionStatus.ACCEPTED, 1L)));

            assertEquals("ACCEPTED", service.getConnectionStatus(1L, 2L));
        }

        @Test
        @DisplayName("Returns PENDING_SENT when requester checks")
        void returnsPendingSent() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(connectionRepository.findBetweenUsers(requester, receiver))
                    .thenReturn(Optional.of(connection(requester, receiver, ConnectionStatus.PENDING, 1L)));

            assertEquals("PENDING_SENT", service.getConnectionStatus(1L, 2L));
        }

        @Test
        @DisplayName("Returns PENDING_RECEIVED when receiver checks")
        void returnsPendingReceived() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(connectionRepository.findBetweenUsers(receiver, requester))
                    .thenReturn(Optional.of(connection(requester, receiver, ConnectionStatus.PENDING, 1L)));

            assertEquals("PENDING_RECEIVED", service.getConnectionStatus(2L, 1L));
        }

        @Test
        @DisplayName("Returns NONE for missing user")
        void returnsNoneForMissingUser() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertEquals("NONE", service.getConnectionStatus(1L, 99L));
        }

        @Test
        @DisplayName("Returns NONE when no connection exists")
        void returnsNoneWhenNoConnection() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(connectionRepository.findBetweenUsers(requester, receiver)).thenReturn(Optional.empty());

            assertEquals("NONE", service.getConnectionStatus(1L, 2L));
        }
    }
}
