package com.evlease.installment.sms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

/**
 * 互亿无线短信发送器实现
 * API文档: http://106.ihuyi.com/webservice/sms.php?method=Submit
 */
public class IhuyiSmsSender implements SmsSender {
  private static final Logger log = LoggerFactory.getLogger(IhuyiSmsSender.class);
  private static final String API_URL = "http://106.ihuyi.com/webservice/sms.php?method=Submit";

  private final String apiId;
  private final String apiKey;
  private final RestTemplate restTemplate;
  private final ObjectMapper objectMapper;

  public IhuyiSmsSender(String apiId, String apiKey) {
    this.apiId = apiId;
    this.apiKey = apiKey;
    this.restTemplate = new RestTemplate();
    this.objectMapper = new ObjectMapper();
  }

  @Override
  public SmsResult send(String phone, String content) {
    try {
      // 构建请求参数
      MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
      params.add("account", apiId);
      params.add("password", apiKey);
      params.add("mobile", phone);
      params.add("content", content);
      params.add("format", "json");

      // 设置请求头
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

      HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

      // 发送请求
      String response = restTemplate.postForObject(API_URL, request, String.class);
      log.info("互亿无线响应: phone={}, response={}", maskPhone(phone), response);

      // 解析响应
      JsonNode json = objectMapper.readTree(response);
      int code = json.get("code").asInt();
      String msg = json.has("msg") ? json.get("msg").asText() : "";
      String smsid = json.has("smsid") ? json.get("smsid").asText() : "";

      // code=2 表示成功
      if (code == 2) {
        log.info("短信发送成功: phone={}, smsid={}", maskPhone(phone), smsid);
        return SmsResult.success(smsid);
      } else {
        log.warn("短信发送失败: phone={}, code={}, msg={}", maskPhone(phone), code, msg);
        return SmsResult.failure(String.valueOf(code), msg);
      }
    } catch (Exception e) {
      log.error("短信发送异常: phone={}, error={}", maskPhone(phone), e.getMessage(), e);
      return SmsResult.failure("EXCEPTION", e.getMessage());
    }
  }

  /**
   * 手机号脱敏：138****1234
   */
  private String maskPhone(String phone) {
    if (phone == null || phone.length() < 7) {
      return phone;
    }
    return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
  }
}
