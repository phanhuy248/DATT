package com.smartshop.demo.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI smartShopOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("SmartShop API")
                        .description("REST API cho hệ thống bán laptop SmartShop — Đồ án tốt nghiệp")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("SmartShop Team")
                                .email("admin@smartshop.vn")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
                .components(new Components()
                        .addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                                .name(BEARER_SCHEME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Nhập JWT access token (không cần 'Bearer ' prefix)")));
    }
}
