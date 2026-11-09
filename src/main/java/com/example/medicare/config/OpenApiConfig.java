package com.example.medicare.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI medicareOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MediCare API")
                        .description("Hệ thống đặt lịch khám bệnh MediCare")
                        .version("1.0.0"));
    }
}