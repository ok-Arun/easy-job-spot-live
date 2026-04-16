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
import com.easyjobspot.backend.job.enums.JobStatus;
import com.easyjobspot.backend.job.repository.JobRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Profile("dev") // remove if you want it always
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final JobSeekerProfileRepository jobSeekerProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        // prevent duplicate data
        if (userRepository.count() > 1) return;

        // ===================== JOB SEEKERS =====================
        User s1 = createSeeker("Rahul Kumar", "rahul@gmail.com");
        User s2 = createSeeker("Arjun Dev", "arjun@gmail.com");
        User s3 = createSeeker("Priya Singh", "priya@gmail.com");

        userRepository.save(s1);
        userRepository.save(s2);
        userRepository.save(s3);

        jobSeekerProfileRepository.save(createProfile(s1, "Rahul", "Kumar", "BCA", "2 years", "Hyderabad"));
        jobSeekerProfileRepository.save(createProfile(s2, "Arjun", "Dev", "MCA", "1 year", "Bangalore"));
        jobSeekerProfileRepository.save(createProfile(s3, "Priya", "Singh", "B.Tech", "3 years", "Delhi"));

        // ===================== PROVIDERS =====================
        User p1 = createProvider("TechNova", "provider1@gmail.com");
        User p2 = createProvider("CloudSphere", "provider2@gmail.com");

        userRepository.save(p1);
        userRepository.save(p2);

        providerProfileRepository.save(createProviderProfile(p1, "TechNova Solutions", "hr@technova.com", "Bangalore"));
        providerProfileRepository.save(createProviderProfile(p2, "CloudSphere Inc.", "hr@cloudsphere.com", "Remote"));

        // ===================== JOBS =====================
        jobRepository.save(createJob("Java Backend Developer", "TechNova", "Bangalore", p1));
        jobRepository.save(createJob("Spring Boot Developer", "TechNova", "Hyderabad", p1));
        jobRepository.save(createJob("Frontend Developer", "CloudSphere", "Remote", p2));
        jobRepository.save(createJob("React Developer", "CloudSphere", "Delhi", p2));
        jobRepository.save(createJob("Full Stack Developer", "TechNova", "Pune", p1));

        System.out.println("✅ Demo data loaded (3 seekers, 2 providers, 5 jobs)");
    }

    // ===================== HELPERS =====================

    private User createSeeker(String name, String email) {
        User u = new User();
        u.setId(UUID.randomUUID());
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
        u.setId(UUID.randomUUID());
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
        p.setId(UUID.randomUUID());
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
        p.setId(UUID.randomUUID());
        p.setUser(user);
        p.setCompanyName(company);
        p.setCompanyEmail(email);
        p.setAddress(address);
        p.setProfileCompleted(true);
        p.setApprovedAt(LocalDateTime.now());
        return p;
    }

    private Job createJob(String title, String company, String location, User provider) {
        Job j = new Job();
        j.setId(UUID.randomUUID());
        j.setTitle(title);
        j.setCompany(company);
        j.setLocation(location);
        j.setDescription(title + " role with growth opportunities.");
        j.setStatus(JobStatus.ACTIVE);
        j.setCreatedBy(provider.getId());
        j.setCreatedAt(LocalDateTime.now());
        j.setJobType("FULL_TIME"); // change if enum
        return j;
    }
}
