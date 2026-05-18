package com.internmatch.internmatch.features.connection;

import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import com.internmatch.internmatch.features.common.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public Connection sendRequest(Long requesterId, Long receiverId) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("Requester not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (connectionRepository.findBetweenUsers(requester, receiver).isPresent()) {
            throw new RuntimeException("Connection request already exists or you are already friends");
        }

        Connection connection = Connection.builder()
                .requester(requester)
                .receiver(receiver)
                .status(ConnectionStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        Connection saved = connectionRepository.save(connection);

        notificationService.createNotification(
                receiver,
                "New Friend Request",
                requester.getName() + " wants to connect with you.",
                "CONNECTION_REQUEST",
                saved.getId()
        );

        return saved;
    }

    @Transactional
    public Connection respondToRequest(Long connectionId, Long userId, ConnectionStatus status) {
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection request not found"));

        if (!connection.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to respond to this request");
        }

        if (connection.getStatus() != ConnectionStatus.PENDING) {
            throw new RuntimeException("Request has already been responded to");
        }

        connection.setStatus(status);
        connection.setRespondedAt(LocalDateTime.now());

        Connection saved = connectionRepository.save(connection);

        if (status == ConnectionStatus.ACCEPTED) {
            notificationService.createNotification(
                    connection.getRequester(),
                    "Connection Request Accepted",
                    connection.getReceiver().getName() + " accepted your connection request.",
                    "CONNECTION_ACCEPTED",
                    saved.getId()
            );
        }

        return saved;
    }

    public List<Connection> getPendingRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return connectionRepository.findByReceiverAndStatus(user, ConnectionStatus.PENDING);
    }

    public List<User> getFriends(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Connection> connections = connectionRepository.findAcceptedConnections(user);
        
        return connections.stream()
                .map(c -> c.getRequester().getId().equals(userId) ? c.getReceiver() : c.getRequester())
                .collect(Collectors.toList());
    }

    public String getConnectionStatus(Long userId, Long otherUserId) {
        User user = userRepository.findById(userId).orElse(null);
        User other = userRepository.findById(otherUserId).orElse(null);
        if (user == null || other == null) return "NONE";

        return connectionRepository.findBetweenUsers(user, other)
                .map(c -> {
                    if (c.getStatus() == ConnectionStatus.ACCEPTED) return "ACCEPTED";
                    if (c.getStatus() == ConnectionStatus.PENDING) {
                        return c.getRequester().getId().equals(userId) ? "PENDING_SENT" : "PENDING_RECEIVED";
                    }
                    return "NONE";
                })
                .orElse("NONE");
    }
}
