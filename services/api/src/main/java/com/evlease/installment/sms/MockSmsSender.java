package com.evlease.installment.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.UUID;

/**
 * Mock短信发送器（开发环境使用）
 * 不真实发送短信，仅记录日志
 */
public class MockSmsSender implements SmsSender {
  private static final Logger log = LoggerFactory.getLogger(MockSmsSender.class);

  @Override
  public SmsResult send(String phone, String content) {
    String mockId = "MOCK_" + UUID.randomUUID().toString().substring(0, 8);
    log.info("[MOCK SMS] phone={}, content={}, mockId={}", phone, content, mockId);
    return SmsResult.success(mockId);
  }
}
