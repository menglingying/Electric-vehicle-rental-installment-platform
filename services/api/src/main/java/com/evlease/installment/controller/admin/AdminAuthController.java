package com.evlease.installment.controller.admin;

import com.evlease.installment.auth.Principal;
import com.evlease.installment.auth.PrincipalType;
import com.evlease.installment.auth.TokenService;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.config.AppProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {
  private final AppProperties appProperties;
  private final TokenService tokenService;

  public AdminAuthController(AppProperties appProperties, TokenService tokenService) {
    this.appProperties = appProperties;
    this.tokenService = tokenService;
  }

  public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
  public record LoginResponse(String token) {}

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest req) {
    if (!appProperties.getAdmin().getUsername().equals(req.username())
      || !appProperties.getAdmin().getPassword().equals(req.password())) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "账号或密码错误");
    }
    var adminId = "a_" + UUID.nameUUIDFromBytes(req.username().getBytes());
    var token = tokenService.issue(new Principal(PrincipalType.ADMIN, adminId, req.username()));
    return new LoginResponse(token);
  }
}

