package com.evlease.installment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public class AppProperties {
  private final Auth auth = new Auth();
  private final Admin admin = new Admin();
  private final Upload upload = new Upload();

  public Auth getAuth() {
    return auth;
  }

  public Admin getAdmin() {
    return admin;
  }

  public Upload getUpload() {
    return upload;
  }

  public static class Auth {
    private final FixedCode fixedCode = new FixedCode();

    public FixedCode getFixedCode() {
      return fixedCode;
    }
  }

  public static class FixedCode {
    private boolean enabled;
    private String value = "123456";
    private List<String> whitelistPhones = List.of();

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }

    public String getValue() {
      return value;
    }

    public void setValue(String value) {
      this.value = value;
    }

    public List<String> getWhitelistPhones() {
      return whitelistPhones;
    }

    public void setWhitelistPhones(List<String> whitelistPhones) {
      this.whitelistPhones = whitelistPhones == null ? List.of() : whitelistPhones;
    }
  }

  public static class Admin {
    private String username = "admin";
    private String password = "admin123";

    public String getUsername() {
      return username;
    }

    public void setUsername(String username) {
      this.username = username;
    }

    public String getPassword() {
      return password;
    }

    public void setPassword(String password) {
      this.password = password;
    }
  }

  public static class Upload {
    private String dir = "uploads";

    public String getDir() {
      return dir;
    }

    public void setDir(String dir) {
      this.dir = dir;
    }
  }
}
