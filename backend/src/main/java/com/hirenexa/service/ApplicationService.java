package com.hirenexa.service;

import com.hirenexa.entity.Application;
import com.hirenexa.entity.Job;
import com.hirenexa.entity.Student;
import com.hirenexa.repository.ApplicationRepository;
import com.hirenexa.repository.JobRepository;
import com.hirenexa.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private MatchScoreService matchScoreService;

    public List<Application> getApplicationsByStudent(String studentId) {
        return applicationRepository.findByStudentId(studentId);
    }

    public List<Application> getApplicationsByJob(String jobId) {
        return applicationRepository.findByJobId(jobId);
    }

    public Application applyToJob(String studentId, String jobId, String notes) {
        // Check if already applied
        List<Application> existing = applicationRepository.findByStudentIdAndJobId(studentId, jobId);
        if (!existing.isEmpty()) {
            throw new RuntimeException("Already applied to this job");
        }

        Job job = jobRepository.findById(jobId)
            .orElseThrow(() -> new RuntimeException("Job not found"));
            
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student profile not found"));

        int score = matchScoreService.computeMatchScore(student.getSkills(), job.getSkillsRequired());

        Application app = new Application();
        app.setId(UUID.randomUUID().toString());
        app.setStudentId(studentId);
        app.setJobId(jobId);
        app.setNotes(notes);
        app.setMatchScore(score);
        app.setStatus("applied");
        app.setAppliedAt(LocalDateTime.now());
        app.setUpdatedAt(LocalDateTime.now());

        return applicationRepository.save(app);
    }

    public Application updateStatus(String applicationId, String status) {
        return applicationRepository.findById(applicationId).map(app -> {
            app.setStatus(status);
            app.setUpdatedAt(LocalDateTime.now());
            return applicationRepository.save(app);
        }).orElseThrow(() -> new RuntimeException("Application not found"));
    }
}
