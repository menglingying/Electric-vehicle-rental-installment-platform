package com.evlease.installment.asign;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "asign")
public class AsignConfig {
  private String baseUrl = "https://prev.asign.cn";
  private String appId = "";
  private String privateKey = "";
  private String publicKey = "";
  private String templateNo = "";
  private String templateFillJson = "";
  private String companyAccount = "";
  private String companyName = "";
  private String companyCertNo = "";
  private String companySerialNo = "";
  private String companyAddress = "";
  private String legalName = "";
  private String legalCertNo = "";
  private String legalPhone = "";
  private String companyMobile = "";
  private String companyContactName = "";
  private String companyContactIdCard = "";
  private int signOrder = 1;
  private int companySignType = 3;
  private int userSignType = 3;
  private String companySignKey = "";
  private String userSignKey = "";
  private String companySignStrategyJson = "";
  private String userSignStrategyJson = "";
  private String notifyUrl = "";
  private String callbackUrl = "";
  private String userNotifyUrl = "";
  private String authNotifyUrl = "";
  private String authRedirectUrl = "";
  private String redirectUrl = "";
  private boolean useStranger = false;
  private int signAttachNo = 1;
  private int signLocationMode = 4;

  public String getBaseUrl() { return baseUrl; }
  public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

  public String getAppId() { return appId; }
  public void setAppId(String appId) { this.appId = appId; }

  public String getPrivateKey() { return privateKey; }
  public void setPrivateKey(String privateKey) { this.privateKey = privateKey; }

  public String getPublicKey() { return publicKey; }
  public void setPublicKey(String publicKey) { this.publicKey = publicKey; }

  public String getTemplateNo() { return templateNo; }
  public void setTemplateNo(String templateNo) { this.templateNo = templateNo; }

  public String getTemplateFillJson() { return templateFillJson; }
  public void setTemplateFillJson(String templateFillJson) { this.templateFillJson = templateFillJson; }

  public String getCompanyAccount() { return companyAccount; }
  public void setCompanyAccount(String companyAccount) { this.companyAccount = companyAccount; }

  public String getCompanyName() { return companyName; }
  public void setCompanyName(String companyName) { this.companyName = companyName; }

  public String getCompanyCertNo() { return companyCertNo; }
  public void setCompanyCertNo(String companyCertNo) { this.companyCertNo = companyCertNo; }

  public String getCompanySerialNo() { return companySerialNo; }
  public void setCompanySerialNo(String companySerialNo) { this.companySerialNo = companySerialNo; }

  public String getCompanyAddress() { return companyAddress; }
  public void setCompanyAddress(String companyAddress) { this.companyAddress = companyAddress; }

  public String getLegalName() { return legalName; }
  public void setLegalName(String legalName) { this.legalName = legalName; }

  public String getLegalCertNo() { return legalCertNo; }
  public void setLegalCertNo(String legalCertNo) { this.legalCertNo = legalCertNo; }

  public String getLegalPhone() { return legalPhone; }
  public void setLegalPhone(String legalPhone) { this.legalPhone = legalPhone; }

  public String getCompanyMobile() { return companyMobile; }
  public void setCompanyMobile(String companyMobile) { this.companyMobile = companyMobile; }

  public String getCompanyContactName() { return companyContactName; }
  public void setCompanyContactName(String companyContactName) { this.companyContactName = companyContactName; }

  public String getCompanyContactIdCard() { return companyContactIdCard; }
  public void setCompanyContactIdCard(String companyContactIdCard) { this.companyContactIdCard = companyContactIdCard; }

  public int getSignOrder() { return signOrder; }
  public void setSignOrder(int signOrder) { this.signOrder = signOrder; }

  public int getCompanySignType() { return companySignType; }
  public void setCompanySignType(int companySignType) { this.companySignType = companySignType; }

  public int getUserSignType() { return userSignType; }
  public void setUserSignType(int userSignType) { this.userSignType = userSignType; }

  public String getCompanySignKey() { return companySignKey; }
  public void setCompanySignKey(String companySignKey) { this.companySignKey = companySignKey; }

  public String getUserSignKey() { return userSignKey; }
  public void setUserSignKey(String userSignKey) { this.userSignKey = userSignKey; }

  public String getCompanySignStrategyJson() { return companySignStrategyJson; }
  public void setCompanySignStrategyJson(String companySignStrategyJson) { this.companySignStrategyJson = companySignStrategyJson; }

  public String getUserSignStrategyJson() { return userSignStrategyJson; }
  public void setUserSignStrategyJson(String userSignStrategyJson) { this.userSignStrategyJson = userSignStrategyJson; }

  public String getNotifyUrl() { return notifyUrl; }
  public void setNotifyUrl(String notifyUrl) { this.notifyUrl = notifyUrl; }

  public String getCallbackUrl() { return callbackUrl; }
  public void setCallbackUrl(String callbackUrl) { this.callbackUrl = callbackUrl; }

  public String getUserNotifyUrl() { return userNotifyUrl; }
  public void setUserNotifyUrl(String userNotifyUrl) { this.userNotifyUrl = userNotifyUrl; }

  public String getAuthNotifyUrl() { return authNotifyUrl; }
  public void setAuthNotifyUrl(String authNotifyUrl) { this.authNotifyUrl = authNotifyUrl; }

  public String getAuthRedirectUrl() { return authRedirectUrl; }
  public void setAuthRedirectUrl(String authRedirectUrl) { this.authRedirectUrl = authRedirectUrl; }

  public String getRedirectUrl() { return redirectUrl; }
  public void setRedirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; }

  public boolean isUseStranger() { return useStranger; }
  public void setUseStranger(boolean useStranger) { this.useStranger = useStranger; }

  public int getSignAttachNo() { return signAttachNo; }
  public void setSignAttachNo(int signAttachNo) { this.signAttachNo = signAttachNo; }

  public int getSignLocationMode() { return signLocationMode; }
  public void setSignLocationMode(int signLocationMode) { this.signLocationMode = signLocationMode; }
}
