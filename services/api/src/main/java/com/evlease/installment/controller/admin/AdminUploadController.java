package com.evlease.installment.controller.admin;

import com.evlease.installment.common.ApiException;
import com.evlease.installment.config.AppProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/uploads")
public class AdminUploadController {
  private final AppProperties appProperties;

  public AdminUploadController(AppProperties appProperties) {
    this.appProperties = appProperties;
  }

  public record UploadResponse(String url) {}

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public UploadResponse upload(@RequestParam("file") MultipartFile file) throws IOException {
    if (file == null || file.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "请选择文件");

    var contentType = file.getContentType();
    if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "仅支持图片文件");
    }

    var original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
    var ext = guessExt(original, contentType);
    var name = "img_" + UUID.randomUUID().toString().replace("-", "") + ext;

    var uploadDir = appProperties.getUpload().getDir();
    if (uploadDir == null || uploadDir.isBlank()) uploadDir = "uploads";
    var dir = Path.of(uploadDir).toAbsolutePath().normalize();
    Files.createDirectories(dir);

    var target = dir.resolve(name).normalize();
    if (!target.startsWith(dir)) throw new ApiException(HttpStatus.BAD_REQUEST, "非法文件名");

    file.transferTo(target);
    return new UploadResponse("/uploads/" + name);
  }

  private String guessExt(String filename, String contentType) {
    var lower = filename.toLowerCase(Locale.ROOT);
    for (var ext : new String[] { ".png", ".jpg", ".jpeg", ".webp", ".gif" }) {
      if (lower.endsWith(ext)) return ext;
    }
    if (contentType == null) return "";
    var ct = contentType.toLowerCase(Locale.ROOT);
    if (ct.contains("png")) return ".png";
    if (ct.contains("jpeg") || ct.contains("jpg")) return ".jpg";
    if (ct.contains("webp")) return ".webp";
    if (ct.contains("gif")) return ".gif";
    return "";
  }
}

