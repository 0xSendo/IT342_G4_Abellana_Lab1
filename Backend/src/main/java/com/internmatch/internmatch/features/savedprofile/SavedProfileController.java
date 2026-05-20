package com.internmatch.internmatch.features.savedprofile;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/saved-profiles")
@RequiredArgsConstructor
public class SavedProfileController {

    private final SavedProfileService savedProfileService;

    @PostMapping("/{studentId}")
    public ResponseEntity<Void> saveProfile(@PathVariable Long studentId, Authentication authentication) {
        savedProfileService.saveProfile(authentication.getName(), studentId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{studentId}")
    public ResponseEntity<Void> unsaveProfile(@PathVariable Long studentId, Authentication authentication) {
        savedProfileService.unsaveProfile(authentication.getName(), studentId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<SavedProfileDto>> getSavedProfiles(Authentication authentication) {
        return ResponseEntity.ok(savedProfileService.getSavedProfiles(authentication.getName()));
    }

    @GetMapping("/check/{studentId}")
    public ResponseEntity<Boolean> isProfileSaved(@PathVariable Long studentId, Authentication authentication) {
        return ResponseEntity.ok(savedProfileService.isProfileSaved(authentication.getName(), studentId));
    }
}
