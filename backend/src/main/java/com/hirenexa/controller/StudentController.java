package com.hirenexa.controller;

import com.hirenexa.entity.Student;
import com.hirenexa.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudent(@PathVariable String id) {
        return studentRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public Student updateStudent(@PathVariable String id, @RequestBody Student updatedStudent) {
        return studentRepository.findById(id).map(student -> {
            student.setRollNumber(updatedStudent.getRollNumber());
            student.setDepartment(updatedStudent.getDepartment());
            student.setCgpa(updatedStudent.getCgpa());
            student.setYearOfStudy(updatedStudent.getYearOfStudy());
            student.setBio(updatedStudent.getBio());
            student.setSkills(updatedStudent.getSkills());
            student.setResumeUrl(updatedStudent.getResumeUrl());
            student.setUpdatedAt(LocalDateTime.now());
            return studentRepository.save(student);
        }).orElseGet(() -> {
            updatedStudent.setId(id);
            updatedStudent.setCreatedAt(LocalDateTime.now());
            updatedStudent.setUpdatedAt(LocalDateTime.now());
            return studentRepository.save(updatedStudent);
        });
    }
}
