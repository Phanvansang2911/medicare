package com.example.medicare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MedicareApplication {
	public static void main(String[] args) {
		SpringApplication.run(MedicareApplication.class, args);
	}
}