package com.evlease.installment.controller.admin;

import com.evlease.installment.auth.AuthContext;
import com.evlease.installment.auth.PrincipalType;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.model.BlacklistEntry;
import com.evlease.installment.repo.BlacklistRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/blacklist")
public class AdminBlacklistController {
  private final BlacklistRepository blacklistRepository;

  public AdminBlacklistController(BlacklistRepository blacklistRepository) {
    this.blacklistRepository = blacklistRepository;
  }

  @GetMapping
  public List<BlacklistEntry> list() {
    return blacklistRepository.findAll().stream()
      .sorted(Comparator.comparing(BlacklistEntry::getCreatedAt).reversed())
      .toList();
  }

  public record AddRequest(@NotBlank String phone, @NotBlank String reason) {}

  @PostMapping
  public void add(@Valid @RequestBody AddRequest req) {
    blacklistRepository.save(new BlacklistEntry(req.phone(), req.reason(), Instant.now()));
  }

  @DeleteMapping("/{phone}")
  public void remove(@PathVariable String phone, HttpServletRequest request) {
    var principal = AuthContext.require(request, PrincipalType.ADMIN);
    if (!"SUPER".equals(principal.role())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "仅总账号可执行删除操作");
    }
    blacklistRepository.deleteById(phone);
  }
}
