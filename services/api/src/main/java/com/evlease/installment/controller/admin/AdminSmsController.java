package com.evlease.installment.controller.admin;

import com.evlease.installment.model.SmsRecord;
import com.evlease.installment.repo.SmsRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/sms")
public class AdminSmsController {
  private final SmsRepository smsRepository;

  public AdminSmsController(SmsRepository smsRepository) {
    this.smsRepository = smsRepository;
  }

  public record SendRequest(@NotBlank String phone, @NotBlank String content) {}

  @PostMapping("/send")
  public SmsRecord send(@Valid @RequestBody SendRequest req) {
    var record = new SmsRecord(
      "sms_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12),
      req.phone(),
      req.content(),
      Instant.now(),
      "MOCK_SENT"
    );
    smsRepository.save(record);
    return record;
  }

  @GetMapping("/records")
  public List<SmsRecord> records() {
    return smsRepository.findAllByOrderByCreatedAtDesc();
  }
}
