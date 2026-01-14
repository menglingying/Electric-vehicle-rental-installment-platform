package com.evlease.installment.juzheng;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 聚证公证平台配置
 */
@Component
@ConfigurationProperties(prefix = "juzheng")
public class JuzhengConfig {
  
  // API基础地址
  private String baseUrl = "https://test.gz.51juzheng.cn";
  
  // 客户端ID
  private String clientId = "85214ca40bd316951d6114365cdcc62f";
  
  // 客户端密钥
  private String clientSecret = "bb22e39a17b09962df93f492b1426183";
  
  // 聚证平台公钥（用于加密请求）
  private String publicKey = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCUk7H4dj8v008hvdhb9arVHy7N8DNE5R66fb6pY2k7qDe+jiEA5oEqcQKq03AcEjdlkPgYK/kNwSt8lQfwfduGMELweDFnAu00EzHoXtvLqodkIe0WvjopZPD5wyQKqJzTCFm7wLEdIseI7sKdi7WKPJdxanfBUMLvDbLgxiyWQQIDAQAB";
  
  // 我方私钥（用于解密响应）
  private String privateKey = "MIICdQIBADANBgkqhkiG9w0BAQEFAASCAl8wggJbAgEAAoGBAJSTsfh2Py/TTyG92Fv1qtUfLs3wM0TlHrp9vqljaTuoN76OIQDmgSpxAqrTcBwSN2WQ+Bgr+Q3BK3yVB/B924YwQvB4MWcC7TQTMehe28uqh2Qh7Ra+Oilk8PnDJAqonNMIWbvAsR0ix4juwp2LtYo8l3Fqd8FQwu8NsuDGLJZBAgMBAAECgYBUxcSIwGcjEY0X8msNZSlYupcI96E5EQWsYGy11zvGxx8vQYcBLYPLRHnCICvaSGaFM+bqW8SZnXsDdUD3bcgfbq8aAnUNzZTHkaVHjaGPx2ZHXy3twAy8hKWgndu0VZ21Pn4hq0TGqaNRnT8Sktwkv394p+vAq+7/4uAem9r4xQJBAPY5iJRQ996sDxni+ucF9U7VCN4QbIzYdH+Mdm0Klmj65IX85345uAFEct9eDxkXG7lYaDbYzaDIzdTZWjdws18CQQCaebvJWOQqjksR72T0mYT9yXbInxcvP8liVbWxk4AAVRBAtjnJOxZbDfPqDIW548eQTOmCBVNwxnLz75ErWbpfAkATwC+1ff00Dmczs2Je77pqtWn9riGW9rH5nUHOo1/HUgDMwqmrFWQuLdhtFHVvlMvzhSTu6VstP45LOZgkBFVPAkALxDoJnDvFAhG1zAZkm00GB9KEdZnOf41XcC/m1tVpMRGL3FWKfnW1edqaeVm2TyNkWndu7/jrHjKjYhwssSkBAkA0Z7RQE5AyrfSooVRms587Qn5VHa3DMxrnXjDvAT2pJtJV31CA6FVUsWapiDVFCNzKoBBYk/ztOb5/L1iKzhYO";
  
  // 企业信息
  private String companyName = "四川时代华锦科技有限公司";
  private String companyCertNo = "91510700MABW8GW58B";
  private String companyAddress = "四川省绵阳市";
  private String legalName = "";
  private String legalCertNo = "";
  private String legalPhone = "";
  private int companyType = 30; // 30-有限公司
  
  // 回调地址
  private String callbackUrl = "";

  public String getBaseUrl() { return baseUrl; }
  public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
  
  public String getClientId() { return clientId; }
  public void setClientId(String clientId) { this.clientId = clientId; }
  
  public String getClientSecret() { return clientSecret; }
  public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
  
  public String getPublicKey() { return publicKey; }
  public void setPublicKey(String publicKey) { this.publicKey = publicKey; }
  
  public String getPrivateKey() { return privateKey; }
  public void setPrivateKey(String privateKey) { this.privateKey = privateKey; }
  
  public String getCompanyName() { return companyName; }
  public void setCompanyName(String companyName) { this.companyName = companyName; }
  
  public String getCompanyCertNo() { return companyCertNo; }
  public void setCompanyCertNo(String companyCertNo) { this.companyCertNo = companyCertNo; }
  
  public String getCompanyAddress() { return companyAddress; }
  public void setCompanyAddress(String companyAddress) { this.companyAddress = companyAddress; }
  
  public String getLegalName() { return legalName; }
  public void setLegalName(String legalName) { this.legalName = legalName; }
  
  public String getLegalCertNo() { return legalCertNo; }
  public void setLegalCertNo(String legalCertNo) { this.legalCertNo = legalCertNo; }
  
  public String getLegalPhone() { return legalPhone; }
  public void setLegalPhone(String legalPhone) { this.legalPhone = legalPhone; }
  
  public int getCompanyType() { return companyType; }
  public void setCompanyType(int companyType) { this.companyType = companyType; }
  
  public String getCallbackUrl() { return callbackUrl; }
  public void setCallbackUrl(String callbackUrl) { this.callbackUrl = callbackUrl; }
}
