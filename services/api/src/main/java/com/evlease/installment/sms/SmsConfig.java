package com.evlease.installment.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 短信服务配置
 */
@Configuration
@EnableScheduling
@EnableConfigurationProperties(SmsProperties.class)
public class SmsConfig {
  private static final Logger log = LoggerFactory.getLogger(SmsConfig.class);

  @Bean
  public SmsSender smsSender(SmsProperties smsProperties) {
    if (smsProperties.isMock()) {
      log.info("短信服务使用 Mock 模式（不真实发送）");
      return new MockSmsSender();
    } else {
      log.info("短信服务使用互亿无线（真实发送）");
      return new IhuyiSmsSender(smsProperties.getApiId(), smsProperties.getApiKey());
    }
  }
}
