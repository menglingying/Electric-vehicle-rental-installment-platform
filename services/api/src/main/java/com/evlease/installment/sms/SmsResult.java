package com.evlease.installment.sms;

/**
 * 短信发送结果
 */
public record SmsResult(
    boolean success,
    String messageId,
    String errorCode,
    String errorMsg
) {
  public static SmsResult success(String messageId) {
    return new SmsResult(true, messageId, null, null);
  }

  public static SmsResult failure(String errorCode, String errorMsg) {
    return new SmsResult(false, null, errorCode, errorMsg);
  }
}
