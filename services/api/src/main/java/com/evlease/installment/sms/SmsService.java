package com.evlease.installment.sms;

import com.evlease.installment.model.SmsRecord;
import com.evlease.installment.repo.SmsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * 统一短信服务
 * 负责短信发送和记录
 */
@Service
public class SmsService {
  private static final Logger log = LoggerFactory.getLogger(SmsService.class);

  private final SmsProperties smsProperties;
  private final SmsSender smsSender;
  private final SmsRepository smsRepository;

  public SmsService(
      SmsProperties smsProperties,
      SmsSender smsSender,
      SmsRepository smsRepository
  ) {
    this.smsProperties = smsProperties;
    this.smsSender = smsSender;
    this.smsRepository = smsRepository;
  }

  /**
   * 发送短信并记录
   * @param phone 手机号
   * @param content 短信内容
   * @param bizType 业务类型: LOGIN/REMIND/OVERDUE/MANUAL
   * @param bizId 关联业务ID（可选）
   * @return 发送结果
   */
  public SmsResult send(String phone, String content, String bizType, String bizId) {
    if (!smsProperties.isEnabled()) {
      log.warn("短信服务未启用");
      return SmsResult.failure("DISABLED", "短信服务未启用");
    }

    // 发送短信
    SmsResult result = smsSender.send(phone, content);

    // 记录短信
    String recordId = "sms_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    SmsRecord record = new SmsRecord();
    record.setId(recordId);
    record.setPhone(phone);
    record.setContent(content);
    record.setBizType(bizType);
    record.setBizId(bizId);
    record.setProvider(smsProperties.isMock() ? "mock" : "ihuyi");
    record.setProviderMsgId(result.messageId());
    record.setStatus(result.success() ? "SENT" : "FAILED");
    record.setErrorCode(result.errorCode());
    record.setErrorMsg(result.errorMsg());
    record.setCreatedAt(Instant.now());

    smsRepository.save(record);

    return result;
  }

  /**
   * 发送验证码短信
   */
  public SmsResult sendVerificationCode(String phone, String code) {
    String content = "您的验证码是：" + code + "。请不要把验证码泄露给其他人。";
    return send(phone, content, "LOGIN", null);
  }

  /**
   * 发送还款提醒短信
   */
  public SmsResult sendRepaymentReminder(String phone, int period, int amount, String dueDate, String orderId) {
    String content = "尊敬的用户，您的第" + period + "期租金" + formatAmount(amount) + "元将于" + dueDate + "到期，请及时还款。";
    return send(phone, content, "REMIND", orderId);
  }

  /**
   * 发送逾期催收短信
   */
  public SmsResult sendOverdueNotice(String phone, int period, int amount, int overdueDays, String orderId) {
    String content = "尊敬的用户，您的第" + period + "期租金" + formatAmount(amount) + "元已逾期" + overdueDays + "天，请尽快还款。";
    return send(phone, content, "OVERDUE", orderId);
  }

  /**
   * 格式化金额（分转元）
   */
  private String formatAmount(int amountInCents) {
    return String.format("%.2f", amountInCents / 100.0);
  }
}
