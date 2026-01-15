package com.evlease.installment.sms;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.sms")
public class SmsProperties {
  private boolean enabled = true;
  private boolean mock = true;
  private String apiId;
  private String apiKey;
  private final RateLimit rateLimit = new RateLimit();
  private final Verification verification = new Verification();

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public boolean isMock() {
    return mock;
  }

  public void setMock(boolean mock) {
    this.mock = mock;
  }

  public String getApiId() {
    return apiId;
  }

  public void setApiId(String apiId) {
    this.apiId = apiId;
  }

  public String getApiKey() {
    return apiKey;
  }

  public void setApiKey(String apiKey) {
    this.apiKey = apiKey;
  }

  public RateLimit getRateLimit() {
    return rateLimit;
  }

  public Verification getVerification() {
    return verification;
  }

  public static class RateLimit {
    private int intervalSeconds = 60;
    private int dailyMaxPerPhone = 10;

    public int getIntervalSeconds() {
      return intervalSeconds;
    }

    public void setIntervalSeconds(int intervalSeconds) {
      this.intervalSeconds = intervalSeconds;
    }

    public int getDailyMaxPerPhone() {
      return dailyMaxPerPhone;
    }

    public void setDailyMaxPerPhone(int dailyMaxPerPhone) {
      this.dailyMaxPerPhone = dailyMaxPerPhone;
    }
  }

  public static class Verification {
    private int expireMinutes = 15;
    private int length = 6;

    public int getExpireMinutes() {
      return expireMinutes;
    }

    public void setExpireMinutes(int expireMinutes) {
      this.expireMinutes = expireMinutes;
    }

    public int getLength() {
      return length;
    }

    public void setLength(int length) {
      this.length = length;
    }
  }
}
