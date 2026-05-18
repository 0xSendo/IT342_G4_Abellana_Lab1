package com.internmatch.internmatch.features.connection;

import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/connections")
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;
    private final UserRepository userRepository;

    @PostMapping("/request/{receiverId}")
    public ResponseEntity<?> sendRequest(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long receiverId) {
        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        try {
            Connection connection = connectionService.sendRequest(currentUser.getId(), receiverId);
            return ResponseEntity.ok(connection);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/respond/{connectionId}")
    public ResponseEntity<?> respondToRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long connectionId,
            @RequestParam ConnectionStatus status) {
        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        try {
            Connection connection = connectionService.respondToRequest(connectionId, currentUser.getId(), status);
            return ResponseEntity.ok(connection);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingRequests(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Connection> requests = connectionService.getPendingRequests(currentUser.getId());
        
        List<Map<String, Object>> response = requests.stream().map(r -> Map.<String, Object>of(
                "id", r.getId(),
                "requesterId", r.getRequester().getId(),
                "requesterName", r.getRequester().getName(),
                "requesterRole", r.getRequester().getRole(),
                "createdAt", r.getCreatedAt()
        )).collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/friends")
    public ResponseEntity<List<Map<String, Object>>> getFriends(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<User> friends = connectionService.getFriends(currentUser.getId());
        
        List<Map<String, Object>> response = friends.stream().map(f -> Map.<String, Object>of(
                "id", f.getId(),
                "name", f.getName(),
                "role", f.getRole(),
                "email", f.getEmail(),
                "companyName", f.getCompanyName() != null ? f.getCompanyName() : "",
                "program", f.getProgram() != null ? f.getProgram() : ""
        )).collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{otherUserId}")
    public ResponseEntity<Map<String, String>> getConnectionStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long otherUserId) {
        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String status = connectionService.getConnectionStatus(currentUser.getId(), otherUserId);
        return ResponseEntity.ok(Map.of("status", status));
    }
}
