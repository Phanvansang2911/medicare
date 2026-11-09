package com.example.medicare.service;

import com.example.medicare.dto.SpecialtyRequest;
import com.example.medicare.dto.SpecialtyResponse;
import com.example.medicare.entity.Specialty;
import com.example.medicare.exception.BusinessException;
import com.example.medicare.repository.SpecialtyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SpecialtyService {

    private final SpecialtyRepository repo;

    public List<SpecialtyResponse> listAll() {
        return repo.findAllByActiveTrue().stream().map(SpecialtyResponse::from).toList();
    }

    public SpecialtyResponse get(Long id) {
        Specialty s = repo.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Không tìm thấy chuyên khoa"));
        return SpecialtyResponse.from(s);
    }

    @Transactional
    public SpecialtyResponse create(SpecialtyRequest req) {
        if (repo.existsByName(req.name())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Chuyên khoa đã tồn tại");
        }
        Specialty s = Specialty.builder()
                .name(req.name().trim())
                .description(req.description())
                .active(req.active() == null || req.active())
                .build();
        return SpecialtyResponse.from(repo.save(s));
    }

    @Transactional
    public SpecialtyResponse update(Long id, SpecialtyRequest req) {
        Specialty s = repo.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Không tìm thấy chuyên khoa"));
        s.setName(req.name().trim());
        s.setDescription(req.description());
        if (req.active() != null) s.setActive(req.active());
        return SpecialtyResponse.from(repo.save(s));
    }

    @Transactional
    public void delete(Long id) {
        Specialty s = repo.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Không tìm thấy chuyên khoa"));
        s.setActive(false);
        repo.save(s);
    }
}