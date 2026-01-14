package com.evlease.installment.config;

import java.nio.file.Path;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class UploadConfig implements WebMvcConfigurer {
  private final AppProperties appProperties;

  public UploadConfig(AppProperties appProperties) {
    this.appProperties = appProperties;
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    var dir = appProperties.getUpload().getDir();
    if (dir == null || dir.isBlank()) return;

    var absolute = Path.of(dir).toAbsolutePath().normalize().toString().replace("\\", "/");
    if (!absolute.endsWith("/")) absolute = absolute + "/";

    registry.addResourceHandler("/uploads/**").addResourceLocations("file:" + absolute);
  }
}

