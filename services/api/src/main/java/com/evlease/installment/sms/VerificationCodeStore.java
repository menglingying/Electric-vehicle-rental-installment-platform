package com.evlease.installment.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 验证码内存存储
 * 支持验证码缓存、频率限制、过期清理
 */
@Component
public class VerificationCodeStore {
  private static final Logger log = LoggerFactory.getLogger(VerificationCodeStore.class);

  // 验证码存储: phone -> CodeEntry
  private final ConcurrentHashMap<String, CodeEntry> codeStore = new ConcurrentHashMap<>();
  // 发送时间存储（用于频率限制）: phone -> lastSendTime
  private final ConcurrentHashMap<String, Instant> sendTimeStore = new ConcurrentHashMap<>();
  // 每日发送次数: phone:date -> count
  private final ConcurrentHashMap<String, Integer> dailyCountStore = new ConcurrentHashMap<>();

  /**
   * 存储验证码
   */
  public void store(String phone, String code, int expireMinutes) {
    Instant expireTime = Instant.now().plusSeconds(expireMinutes * 60L);
    codeStore.put(phone, new CodeEntry(code, expireTime));
    sendTimeStore.put(phone, Instant.now());
    
    // 增加每日计数
    String dailyKey = phone + ":" + LocalDate.now(ZoneId.of("Asia/Shanghai"));
    dailyCountStore.merge(dailyKey, 1, Integer::sum);
    
    log.debug("验证码已存储: phone={}, expireAt={}", maskPhone(phone), expireTime);
  }

  /**
   * 验证并消费验证码（验证成功后删除）
   */
  public boolean verify(String phone, String code) {
    CodeEntry entry = codeStore.get(phone);
    if (entry == null) {
      log.debug("验证码不存在: phone={}", maskPhone(phone));
      return false;
    }
    if (entry.isExpired()) {
      log.debug("验证码已过期: phone={}", maskPhone(phone));
      codeStore.remove(phone);
      return false;
    }
    if (!entry.code().equals(code)) {
      log.debug("验证码不匹配: phone={}", maskPhone(phone));
      return false;
    }
    // 验证成功，删除验证码（一次性使用）
    codeStore.remove(phone);
    log.debug("验证码验证成功: phone={}", maskPhone(phone));
    return true;
  }

  /**
   * 检查是否可以发送（频率限制）
   */
  public boolean canSend(String phone, int intervalSeconds, int dailyMax) {
    // 检查发送间隔
    Instant lastSend = sendTimeStore.get(phone);
    if (lastSend != null) {
      long secondsSinceLastSend = Instant.now().getEpochSecond() - lastSend.getEpochSecond();
      if (secondsSinceLastSend < intervalSeconds) {
        log.debug("发送过于频繁: phone={}, secondsSinceLastSend={}", maskPhone(phone), secondsSinceLastSend);
        return false;
      }
    }

    // 检查每日限制
    String dailyKey = phone + ":" + LocalDate.now(ZoneId.of("Asia/Shanghai"));
    Integer count = dailyCountStore.get(dailyKey);
    if (count != null && count >= dailyMax) {
      log.debug("超过每日限制: phone={}, count={}", maskPhone(phone), count);
      return false;
    }

    return true;
  }

  /**
   * 获取距离下次可发送的剩余秒数
   */
  public int getSecondsUntilNextSend(String phone, int intervalSeconds) {
    Instant lastSend = sendTimeStore.get(phone);
    if (lastSend == null) {
      return 0;
    }
    long secondsSinceLastSend = Instant.now().getEpochSecond() - lastSend.getEpochSecond();
    int remaining = (int) (intervalSeconds - secondsSinceLastSend);
    return Math.max(0, remaining);
  }

  /**
   * 定时清理过期数据（每分钟执行）
   */
  @Scheduled(fixedRate = 60000)
  public void cleanExpired() {
    int removedCodes = 0;
    int removedSendTimes = 0;
    int removedDailyCounts = 0;

    // 清理过期验证码
    var codeIterator = codeStore.entrySet().iterator();
    while (codeIterator.hasNext()) {
      if (codeIterator.next().getValue().isExpired()) {
        codeIterator.remove();
        removedCodes++;
      }
    }

    // 清理过期发送时间（超过1小时）
    Instant oneHourAgo = Instant.now().minusSeconds(3600);
    var sendIterator = sendTimeStore.entrySet().iterator();
    while (sendIterator.hasNext()) {
      if (sendIterator.next().getValue().isBefore(oneHourAgo)) {
        sendIterator.remove();
        removedSendTimes++;
      }
    }

    // 清理非今日的每日计数
    String todaySuffix = ":" + LocalDate.now(ZoneId.of("Asia/Shanghai"));
    var dailyIterator = dailyCountStore.keySet().iterator();
    while (dailyIterator.hasNext()) {
      if (!dailyIterator.next().endsWith(todaySuffix)) {
        dailyIterator.remove();
        removedDailyCounts++;
      }
    }

    if (removedCodes > 0 || removedSendTimes > 0 || removedDailyCounts > 0) {
      log.debug("清理过期数据: codes={}, sendTimes={}, dailyCounts={}", 
          removedCodes, removedSendTimes, removedDailyCounts);
    }
  }

  private String maskPhone(String phone) {
    if (phone == null || phone.length() < 7) return phone;
    return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
  }

  /**
   * 验证码条目
   */
  public record CodeEntry(String code, Instant expireTime) {
    public boolean isExpired() {
      return Instant.now().isAfter(expireTime);
    }
  }
}
