package com.hirenexa.controller;

import com.hirenexa.entity.Interview;
import com.hirenexa.repository.InterviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    @Autowired
    private InterviewRepository interviewRepository;

    @GetMapping
    public List<Interview> getInterviews(@RequestParam(required = false) String status) {
        if (status != null) {
            return interviewRepository.findByStatus(status);
        }
        return interviewRepository.findAll();
    }

    @PostMapping
    public Interview scheduleInterview(@RequestBody Interview interview) {
        if (interview.getId() == null || interview.getId().isEmpty()) {
            interview.setId(UUID.randomUUID().toString());
        }
        interview.setStatus("scheduled");
        interview.setCreatedAt(LocalDateTime.now());
        interview.setUpdatedAt(LocalDateTime.now());
        return interviewRepository.save(interview);
    }

    @PatchMapping("/{id}/status")
    public Interview updateStatus(@PathVariable String id, @RequestParam String status) {
        return interviewRepository.findById(id).map(interview -> {
            interview.setStatus(status);
            interview.setUpdatedAt(LocalDateTime.now());
            return interviewRepository.save(interview);
        }).orElseThrow(() -> new RuntimeException("Interview not found"));
    }
}
