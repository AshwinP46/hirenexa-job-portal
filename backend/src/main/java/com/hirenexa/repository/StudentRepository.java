package com.hirenexa.repository;

import com.hirenexa.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRepository extends JpaRepository<Student, String> {
    List<Student> findByDepartment(String department);
    long countByDepartment(String department);
}
