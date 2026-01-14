package com.evlease.installment.controller.h5;

import com.evlease.installment.auth.Principal;
import com.evlease.installment.auth.PrincipalType;
import com.evlease.installment.auth.TokenService;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.config.AppProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/h5/auth")
public class H5AuthController {
  private final AppProperties appProperties;
  private final TokenService tokenService;

  public H5AuthController(AppProperties appProperties, TokenService tokenService) {
    this.appProperties = appProperties;
    this.tokenService = tokenService;
  }

  public record RequestCodeRequest(@NotBlank String phone) {}

  @PostMapping("/request-code")
  public Map<String, Object> requestCode(@Valid @RequestBody RequestCodeRequest req) {
    if (isFixedCodeAllowed(req.phone())) {
      return Map.of("message", "ok", "devFixedCode", appProperties.getAuth().getFixedCode().getValue());
    }
    return Map.of("message", "ok");
  }

  public record LoginRequest(@NotBlank String phone, @NotBlank String code) {}
  public record LoginResponse(String token) {}

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest req) {
    var fixedCode = appProperties.getAuth().getFixedCode();

    if (!isFixedCodeAllowed(req.phone())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "短信验证码服务未接入");
    }
    if (!fixedCode.getValue().equals(req.code())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "验证码错误");
    }

    var userId = "u_" + UUID.nameUUIDFromBytes(req.phone().getBytes());
    var token = tokenService.issue(new Principal(PrincipalType.H5, userId, req.phone()));
    return new LoginResponse(token);
  }

  private boolean isFixedCodeAllowed(String phone) {
    var fixedCode = appProperties.getAuth().getFixedCode();
    if (fixedCode.isEnabled()) return true;
    return fixedCode.getWhitelistPhones().stream().anyMatch(phone::equals);
  }
}
