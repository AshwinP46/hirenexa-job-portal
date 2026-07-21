package com.hirenexa.repository;

import com.hirenexa.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Job Repository
 * Provides data access methods for the jobs table.
 */
@Repository
public interface JobRepository extends JpaRepository<Job, String> {

    // Find all active jobs
    List<Job> findByIsActiveTrue();

    // Find all jobs posted by a specific recruiter
    List<Job> findByRecruiterId(String recruiterId);

    // Find active jobs by recruiter
    List<Job> findByRecruiterIdAndIsActiveTrue(String recruiterId);

    // Search jobs by title keyword
    List<Job> findByTitleContainingIgnoreCaseAndIsActiveTrue(String keyword);

    // Find jobs by location
    List<Job> findByLocationContainingIgnoreCaseAndIsActiveTrue(String location);

    // Find jobs with minimum package
    List<Job> findByPackageLpaGreaterThanEqualAndIsActiveTrue(Double minPackage);

    // Count active jobs
    long countByIsActiveTrue();

    // Count jobs by recruiter
    long countByRecruiterId(String recruiterId);
}
