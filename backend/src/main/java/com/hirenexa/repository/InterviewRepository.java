package com.hirenexa.repository;

import com.hirenexa.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, String> {
    List<Interview> findByApplicationId(String applicationId);
    List<Interview> findByStatus(String status);
}
