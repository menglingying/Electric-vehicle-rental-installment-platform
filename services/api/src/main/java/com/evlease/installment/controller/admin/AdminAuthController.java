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
  public record LoginResponse(String token, String role) {}

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest req) {
    // 先检查多账号列表
    var accounts = appProperties.getAdmin().getAccounts();
    for (var account : accounts) {
      if (account.getUsername().equals(req.username()) && account.getPassword().equals(req.password())) {
        var adminId = "a_" + UUID.nameUUIDFromBytes(req.username().getBytes());
        var token = tokenService.issue(new Principal(PrincipalType.ADMIN, adminId, req.username(), account.getRole()));
        return new LoginResponse(token, account.getRole());
      }
    }
    // 兼容原有默认账号（作为 SUPER 角色）
    if (appProperties.getAdmin().getUsername().equals(req.username())
      && appProperties.getAdmin().getPassword().equals(req.password())) {
      var adminId = "a_" + UUID.nameUUIDFromBytes(req.username().getBytes());
      var token = tokenService.issue(new Principal(PrincipalType.ADMIN, adminId, req.username(), "SUPER"));
      return new LoginResponse(token, "SUPER");
    }
    throw new ApiException(HttpStatus.UNAUTHORIZED, "账号或密码错误");
  }
}

