package com.evlease.installment.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AuthFilter extends OncePerRequestFilter {
  public static final String REQ_PRINCIPAL_ATTR = "principal";

  private final TokenService tokenService;

  public AuthFilter(TokenService tokenService) {
    this.tokenService = tokenService;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
    var path = request.getRequestURI();
    if (!path.startsWith("/api/")) return true;
    if (path.startsWith("/api/h5/auth/")) return true;
    if (path.startsWith("/api/h5/products")) return true;  // 商品列表公开访问
    if (path.startsWith("/api/admin/auth/")) return true;
    if (path.startsWith("/api/callbacks/")) return true;
    if (path.startsWith("/api/callback/")) return true;
    if (path.equals("/api/health")) return true;
    return false;
  }

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    var path = request.getRequestURI();
    var requiredType = path.startsWith("/api/admin/") ? PrincipalType.ADMIN : PrincipalType.H5;

    var token = extractBearer(request);
    var principal = tokenService.verify(token);
    if (principal == null || principal.type() != requiredType) {
      writeError(response, HttpStatus.UNAUTHORIZED, "登录已过期，请重新登录");
      return;
    }

    request.setAttribute(REQ_PRINCIPAL_ATTR, principal);
    filterChain.doFilter(request, response);
  }

  private String extractBearer(HttpServletRequest request) {
    var auth = request.getHeader("Authorization");
    if (auth == null) return null;
    var prefix = "Bearer ";
    if (!auth.startsWith(prefix)) return null;
    return auth.substring(prefix.length()).trim();
  }

  private void writeError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
    response.resetBuffer();
    response.setStatus(status.value());
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");
    response.getWriter().write("{\"message\":\"" + message.replace("\"", "\\\"") + "\"}");
    response.flushBuffer();
  }
}
