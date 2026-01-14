package com.evlease.installment.auth;

import com.evlease.installment.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;

public class AuthContext {
  private AuthContext() {}

  public static Principal principal(HttpServletRequest request) {
    return (Principal) request.getAttribute(AuthFilter.REQ_PRINCIPAL_ATTR);
  }

  public static Principal require(HttpServletRequest request, PrincipalType type) {
    var p = principal(request);
    if (p == null || p.type() != type) throw new ApiException(HttpStatus.UNAUTHORIZED, "未登录");
    return p;
  }
}

