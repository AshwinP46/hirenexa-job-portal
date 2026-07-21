package com.hirenexa.controller;

import com.hirenexa.entity.Recruiter;
import com.hirenexa.repository.RecruiterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/recruiters")
public class RecruiterController {

    @Autowired
    private RecruiterRepository recruiterRepository;

    @GetMapping("/{id}")
    public ResponseEntity<Recruiter> getRecruiter(@PathVariable String id) {
        return recruiterRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public Recruiter updateRecruiter(@PathVariable String id, @RequestBody Recruiter updatedRecruiter) {
        return recruiterRepository.findById(id).map(recruiter -> {
            recruiter.setRecruiterName(updatedRecruiter.getRecruiterName());
            recruiter.setCompanyName(updatedRecruiter.getCompanyName());
            recruiter.setIndustry(updatedRecruiter.getIndustry());
            recruiter.setWebsite(updatedRecruiter.getWebsite());
            recruiter.setCompanyLogo(updatedRecruiter.getCompanyLogo());
            recruiter.setUpdatedAt(LocalDateTime.now());
            return recruiterRepository.save(recruiter);
        }).orElseGet(() -> {
            updatedRecruiter.setId(id);
            updatedRecruiter.setCreatedAt(LocalDateTime.now());
            updatedRecruiter.setUpdatedAt(LocalDateTime.now());
            return recruiterRepository.save(updatedRecruiter);
        });
    }
}
