package com.internmatch.internmatch.features.connection;

import com.internmatch.internmatch.features.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ConnectionRepository extends JpaRepository<Connection, Long> {

    List<Connection> findByReceiverAndStatus(User receiver, ConnectionStatus status);

    @Query("SELECT c FROM Connection c WHERE (c.requester = :user OR c.receiver = :user) AND c.status = 'ACCEPTED'")
    List<Connection> findAcceptedConnections(@Param("user") User user);

    Optional<Connection> findByRequesterAndReceiver(User requester, User receiver);

    @Query("SELECT c FROM Connection c WHERE ((c.requester = :user1 AND c.receiver = :user2) OR (c.requester = :user2 AND c.receiver = :user1))")
    Optional<Connection> findBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
}
