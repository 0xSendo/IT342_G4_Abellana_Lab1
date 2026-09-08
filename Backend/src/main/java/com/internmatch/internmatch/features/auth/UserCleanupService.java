package com.internmatch.internmatch.features.auth;

import com.internmatch.internmatch.features.common.community.CommunityPostRepository;
import com.internmatch.internmatch.features.common.notification.NotificationRepository;
import com.internmatch.internmatch.features.connection.ConnectionRepository;
import com.internmatch.internmatch.features.internship.ApplicationRepository;
import com.internmatch.internmatch.features.internship.InternshipRepository;
import com.internmatch.internmatch.features.savedprofile.SavedProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserCleanupService {

    private final NotificationRepository notificationRepository;
    private final CommunityPostRepository communityPostRepository;
    private final ConnectionRepository connectionRepository;
    private final SavedProfileRepository savedProfileRepository;
    private final ApplicationRepository applicationRepository;
    private final InternshipRepository internshipRepository;
    private final UserRepository userRepository;

    /**
     * Remove a user together with every row that references them so the
     * account can be terminated without foreign-key failures or orphaned data.
     * Order matters: rows pointing at the user's internships must be deleted
     * before those internships themselves.
     */
    @Transactional
    public void deleteUserWithData(Long userId) {
        notificationRepository.deleteByUserId(userId);
        communityPostRepository.deleteByStudentId(userId);
        connectionRepository.deleteByRequesterIdOrReceiverId(userId);
        savedProfileRepository.deleteByEmployerIdOrStudentId(userId);

        applicationRepository.deleteByStudentId(userId);
        applicationRepository.deleteByInternshipPostedById(userId);
        internshipRepository.deleteByPostedById(userId);

        userRepository.deleteById(userId);
    }
}