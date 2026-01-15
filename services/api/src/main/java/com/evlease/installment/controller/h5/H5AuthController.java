package com.evlease.installment.controller.h5;

import com.evlease.installment.auth.Principal;
import com.evlease.installment.auth.PrincipalType;
import com.evlease.installment.auth.TokenService;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.config.AppProperties;
import com.evlease.installment.sms.VerificationCodeService;
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
  private final VerificationCodeService verificationCodeService;

  public H5AuthController(
      AppProperties appProperties,
      TokenService tokenService,
      VerificationCodeService verificationCodeService
  ) {
    this.appProperties = appProperties;
    this.tokenService = tokenService;
    this.verificationCodeService = verificationCodeService;
  }

  public record RequestCodeRequest(@NotBlank String phone) {}

  @PostMapping("/request-code")
  public Map<String, Object> requestCode(@Valid @RequestBody RequestCodeRequest req) {
    // 开发环境且启用固定码，直接返回
    if (isFixedCodeAllowed(req.phone())) {
      return Map.of(
          "message", "ok",
          "devFixedCode", appProperties.getAuth().getFixedCode().getValue(),
          "expireMinutes", 15
      );
    }

    // 发送真实验证码
    var result = verificationCodeService.sendCode(req.phone());
    if (!result.success()) {
      throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, result.message());
    }

    return Map.of(
        "message", "ok",
        "expireMinutes", result.expireMinutes()
    );
  }

  public record LoginRequest(@NotBlank String phone, @NotBlank String code) {}
  public record LoginResponse(String token) {}

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest req) {
    var fixedCode = appProperties.getAuth().getFixedCode();

    // 开发环境固定码验证
    if (isFixedCodeAllowed(req.phone()) && fixedCode.getValue().equals(req.code())) {
      return issueToken(req.phone());
    }

    // 真实验证码验证
    if (!verificationCodeService.verify(req.phone(), req.code())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "验证码错误或已过期");
    }

    return issueToken(req.phone());
  }

  private LoginResponse issueToken(String phone) {
    var userId = "u_" + UUID.nameUUIDFromBytes(phone.getBytes());
    var token = tokenService.issue(new Principal(PrincipalType.H5, userId, phone));
    return new LoginResponse(token);
  }

  private boolean isFixedCodeAllowed(String phone) {
    var fixedCode = appProperties.getAuth().getFixedCode();
    if (fixedCode.isEnabled()) return true;
    return fixedCode.getWhitelistPhones().stream().anyMatch(phone::equals);
  }
}
