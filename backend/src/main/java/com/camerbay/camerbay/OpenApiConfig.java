package com.camerbay.camerbay;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Camerbay API")
                        .version("1.0.0")
                        .description("Camerbay Marketplace API")
                        .contact(new Contact()
                                .name("Camerbay Team")
                                .email("team@camerbay.com")))
                .servers(List.of(
                        new Server().url("http://localhost:8082").description("Local Development")))
                .addSecurityItem(new SecurityRequirement().addList("bearer-token"))
                .components(new Components()
                        .addSecuritySchemes("bearer-token", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("opaque")
                                .description("Opaque token from Zitadel")));
    }
}