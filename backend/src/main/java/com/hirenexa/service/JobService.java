package com.hirenexa.service;

import com.hirenexa.entity.Job;
import com.hirenexa.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    public List<Job> getAllActiveJobs() {
        return jobRepository.findByIsActiveTrue();
    }

    public List<Job> getJobsByRecruiter(String recruiterId) {
        return jobRepository.findByRecruiterId(recruiterId);
    }

    public Optional<Job> getJobById(String id) {
        return jobRepository.findById(id);
    }

    public Job createJob(Job job) {
        if (job.getId() == null || job.getId().isEmpty()) {
            job.setId(UUID.randomUUID().toString());
        }
        job.setCreatedAt(LocalDateTime.now());
        job.setUpdatedAt(LocalDateTime.now());
        job.setIsActive(true);
        return jobRepository.save(job);
    }

    public Job updateJob(String id, Job updatedJob) {
        return jobRepository.findById(id).map(job -> {
            job.setTitle(updatedJob.getTitle());
            job.setDescription(updatedJob.getDescription());
            job.setPackageLpa(updatedJob.getPackageLpa());
            job.setSkillsRequired(updatedJob.getSkillsRequired());
            job.setOpenings(updatedJob.getOpenings());
            job.setMinimumCgpa(updatedJob.getMinimumCgpa());
            job.setLocation(updatedJob.getLocation());
            job.setJobType(updatedJob.getJobType());
            job.setDeadline(updatedJob.getDeadline());
            job.setIsActive(updatedJob.getIsActive());
            job.setUpdatedAt(LocalDateTime.now());
            return jobRepository.save(job);
        }).orElseThrow(() -> new RuntimeException("Job not found with id " + id));
    }

    public void deleteJob(String id) {
        jobRepository.deleteById(id);
    }
}
