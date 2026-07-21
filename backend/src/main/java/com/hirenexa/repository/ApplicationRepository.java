package com.hirenexa.repository;

import com.hirenexa.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, String> {
    List<Application> findByStudentId(String studentId);
    List<Application> findByJobId(String jobId);
    List<Application> findByStudentIdAndJobId(String studentId, String jobId);
    long countByJobId(String jobId);
    long countByStatus(String status);
}
