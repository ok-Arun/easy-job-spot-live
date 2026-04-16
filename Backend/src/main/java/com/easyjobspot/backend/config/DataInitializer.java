package com.easyjobspot.backend.config;

import com.easyjobspot.backend.user.entity.User;
import com.easyjobspot.backend.user.enums.Role;
import com.easyjobspot.backend.user.enums.UserType;
import com.easyjobspot.backend.user.enums.ProviderStatus;

import com.easyjobspot.backend.user.repository.UserRepository;

import com.easyjobspot.backend.profile.entity.JobSeekerProfile;
import com.easyjobspot.backend.profile.entity.ProviderProfile;
import com.easyjobspot.backend.profile.repository.JobSeekerProfileRepository;
import com.easyjobspot.backend.profile.repository.ProviderProfileRepository;

import com.easyjobspot.backend.job.entity.Job;
import com.easyjobspot.backend.job.repository.JobRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Profile("dev")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final JobSeekerProfileRepository jobSeekerProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        if (userRepository.count() > 1) return;

        // ===== JOB SEEKERS =====
        User s1 = createSeeker("Rahul Kumar", "rahul@gmail.com");
        User s2 = createSeeker("Arjun Dev", "arjun@gmail.com");
        User s3 = createSeeker("Priya Singh", "priya@gmail.com");

        userRepository.save(s1);
        userRepository.save(s2);
        userRepository.save(s3);

        jobSeekerProfileRepository.save(createProfile(s1, "Rahul", "Kumar", "BCA", "2 years", "Hyderabad"));
        jobSeekerProfileRepository.save(createProfile(s2, "Arjun", "Dev", "MCA", "1 year", "Bangalore"));
        jobSeekerProfileRepository.save(createProfile(s3, "Priya", "Singh", "B.Tech", "3 years", "Delhi"));

        // ===== PROVIDERS =====
        User p1 = createProvider("TechNova", "provider1@gmail.com");
        User p2 = createProvider("CloudSphere", "provider2@gmail.com");

        userRepository.save(p1);
        userRepository.save(p2);

        providerProfileRepository.save(createProviderProfile(p1, "TechNova Solutions", "hr@technova.com", "Bangalore"));
        providerProfileRepository.save(createProviderProfile(p2, "CloudSphere Inc.", "hr@cloudsphere.com", "Remote"));

        // ===== JOBS =====
        saveApprovedJob("Java Backend Developer", "TechNova", "Bangalore", p1);
        saveApprovedJob("Spring Boot Developer", "TechNova", "Hyderabad", p1);
        saveApprovedJob("Frontend Developer", "CloudSphere", "Remote", p2);
        saveApprovedJob("React Developer", "CloudSphere", "Delhi", p2);
        saveApprovedJob("Full Stack Developer", "TechNova", "Pune", p1);
    }

    private User createSeeker(String name, String email) {
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode("12345678"));
        u.setRole(Role.USER);
        u.setUserType(UserType.JOB_SEEKER);
        u.setProfileCompleted(true);
        return u;
    }

    private User createProvider(String name, String email) {
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode("12345678"));
        u.setRole(Role.USER);
        u.setUserType(UserType.JOB_PROVIDER);
        u.setProviderStatus(ProviderStatus.APPROVED);
        return u;
    }

    private JobSeekerProfile createProfile(User user, String first, String last,
                                           String edu, String exp, String location) {
        JobSeekerProfile p = new JobSeekerProfile();
        p.setUser(user);
        p.setFirstName(first);
        p.setLastName(last);
        p.setEducation(edu);
        p.setExperience(exp);
        p.setLocation(location);
        p.setProfileCompleted(true);
        return p;
    }

    private ProviderProfile createProviderProfile(User user, String company,
                                                  String email, String address) {
        ProviderProfile p = new ProviderProfile();
        p.setUser(user);
        p.setCompanyName(company);
        p.setCompanyEmail(email);
        p.setAddress(address);
        p.setProfileCompleted(true);
        p.setApprovedAt(LocalDateTime.now());
        return p;
    }

    private Job createJob(String title, String company, String location, User provider) {
        return Job.builder()
                .title(title)
                .company(company)
                .category("IT")
                .location(location)
                .jobType(Job.JobType.FULL_TIME)
                .description(title + " role with growth opportunities.")
                .createdBy(provider.getId())
                .build();
    }

    private void saveApprovedJob(String title, String company, String location, User provider) {
        Job job = createJob(title, company, location, provider);
        job = jobRepository.save(job);
        job.approve();
        jobRepository.save(job);
    }
}
