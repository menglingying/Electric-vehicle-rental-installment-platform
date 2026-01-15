package com.evlease.installment.controller.admin;

import com.evlease.installment.model.SmsRecord;
import com.evlease.installment.repo.SmsRepository;
import com.evlease.installment.sms.SmsService;
import com.evlease.installment.sms.SmsResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/sms")
public class AdminSmsController {
  private final SmsRepository smsRepository;
  private final SmsService smsService;

  public AdminSmsController(SmsRepository smsRepository, SmsService smsService) {
    this.smsRepository = smsRepository;
    this.smsService = smsService;
  }

  public record SendRequest(@NotBlank String phone, @NotBlank String content) {}

  @PostMapping("/send")
  public Map<String, Object> send(@Valid @RequestBody SendRequest req) {
    SmsResult result = smsService.send(req.phone(), req.content(), "MANUAL", null);
    return Map.of(
        "success", result.success(),
        "messageId", result.messageId() != null ? result.messageId() : "",
        "errorCode", result.errorCode() != null ? result.errorCode() : "",
        "errorMsg", result.errorMsg() != null ? result.errorMsg() : ""
    );
  }

  @GetMapping("/records")
  public List<SmsRecord> records() {
    return smsRepository.findAllByOrderByCreatedAtDesc();
  }
}
