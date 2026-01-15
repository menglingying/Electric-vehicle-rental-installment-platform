package com.evlease.installment.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

/**
 * 验证码服务
 * 负责验证码的生成、发送、验证
 */
@Service
public class VerificationCodeService {
  private static final Logger log = LoggerFactory.getLogger(VerificationCodeService.class);
  private static final SecureRandom RANDOM = new SecureRandom();

  private final SmsProperties smsProperties;
  private final VerificationCodeStore codeStore;
  private final SmsSender smsSender;

  public VerificationCodeService(
      SmsProperties smsProperties,
      VerificationCodeStore codeStore,
      SmsSender smsSender
  ) {
    this.smsProperties = smsProperties;
    this.codeStore = codeStore;
    this.smsSender = smsSender;
  }

  /**
   * 发送验证码
   * @return 发送结果
   */
  public SendCodeResult sendCode(String phone) {
    var rateLimit = smsProperties.getRateLimit();
    var verification = smsProperties.getVerification();

    // 检查频率限制
    if (!codeStore.canSend(phone, rateLimit.getIntervalSeconds(), rateLimit.getDailyMaxPerPhone())) {
      int waitSeconds = codeStore.getSecondsUntilNextSend(phone, rateLimit.getIntervalSeconds());
      if (waitSeconds > 0) {
        return SendCodeResult.tooFrequent(waitSeconds);
      }
      return SendCodeResult.dailyLimitExceeded();
    }

    // 生成验证码
    String code = generateCode(verification.getLength());

    // 构建短信内容（使用互亿无线默认模板格式）
    String content = "您的验证码是：" + code + "。请不要把验证码泄露给其他人。";

    // 发送短信
    SmsResult smsResult = smsSender.send(phone, content);

    if (smsResult.success()) {
      // 存储验证码
      codeStore.store(phone, code, verification.getExpireMinutes());
      log.info("验证码发送成功: phone={}", maskPhone(phone));
      return SendCodeResult.success(verification.getExpireMinutes());
    } else {
      log.warn("验证码发送失败: phone={}, error={}", maskPhone(phone), smsResult.errorMsg());
      return SendCodeResult.sendFailed(smsResult.errorMsg());
    }
  }

  /**
   * 验证验证码
   */
  public boolean verify(String phone, String code) {
    return codeStore.verify(phone, code);
  }

  /**
   * 生成指定长度的数字验证码
   */
  private String generateCode(int length) {
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < length; i++) {
      sb.append(RANDOM.nextInt(10));
    }
    return sb.toString();
  }

  private String maskPhone(String phone) {
    if (phone == null || phone.length() < 7) return phone;
    return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
  }

  /**
   * 发送验证码结果
   */
  public record SendCodeResult(
      boolean success,
      String message,
      int expireMinutes,
      int waitSeconds
  ) {
    public static SendCodeResult success(int expireMinutes) {
      return new SendCodeResult(true, "验证码已发送", expireMinutes, 0);
    }

    public static SendCodeResult tooFrequent(int waitSeconds) {
      return new SendCodeResult(false, "发送过于频繁，请" + waitSeconds + "秒后重试", 0, waitSeconds);
    }

    public static SendCodeResult dailyLimitExceeded() {
      return new SendCodeResult(false, "今日发送次数已达上限", 0, 0);
    }

    public static SendCodeResult sendFailed(String error) {
      return new SendCodeResult(false, "发送失败：" + error, 0, 0);
    }
  }
}
