package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Controller
public class OAuth2LoginController {

    @Value("${app.oauth2.frontend-redirect-uri:http://localhost:3000/oauth2/callback}")
    private String frontendRedirectUri;

    @GetMapping("/oauth2/authorization/google")
    public RedirectView googleLoginNotConfigured() {
        String base = withoutFragment(frontendRedirectUri);
        String separator = base.contains("?") ? "&" : "?";
        return new RedirectView(base + separator + "error=" + encode("google_oauth_not_configured"));
    }

    private String withoutFragment(String url) {
        int fragmentIndex = url.indexOf('#');
        return fragmentIndex >= 0 ? url.substring(0, fragmentIndex) : url;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
