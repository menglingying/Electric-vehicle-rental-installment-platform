package com.evlease.installment.sms;

/**
 * 短信发送器接口
 */
public interface SmsSender {
  /**
   * 发送短信
   * @param phone 手机号
   * @param content 短信内容
   * @return 发送结果
   */
  SmsResult send(String phone, String content);
}
