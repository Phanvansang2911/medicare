package com.example.medicare.service;

import com.example.medicare.dto.NotificationResponse;
import com.example.medicare.entity.Notification;
import com.example.medicare.entity.User;
import com.example.medicare.enums.NotificationType;
import com.example.medicare.exception.BusinessException;
import com.example.medicare.repository.NotificationRepository;
import com.example.medicare.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repo;
    private final CurrentUserService currentUserService;

    public void push(User user, NotificationType type, String title, String content) {
        repo.save(Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .content(content)
                .read(false)
                .build());
    }

    public Page<NotificationResponse> myNotifications(int page, int size) {
        User u = currentUserService.getCurrentUser();
        return repo.findByUserIdOrderByCreatedAtDesc(u.getId(), PageRequest.of(page, size))
                .map(NotificationResponse::from);
    }

    public long unreadCount() {
        User u = currentUserService.getCurrentUser();
        return repo.countByUserIdAndReadFalse(u.getId());
    }

    @Transactional
    public void markRead(Long id) {
        Notification n = repo.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Không tìm thấy thông báo"));
        User u = currentUserService.getCurrentUser();
        if (!n.getUser().getId().equals(u.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Không có quyền");
        }
        n.setRead(true);
        repo.save(n);
    }
}