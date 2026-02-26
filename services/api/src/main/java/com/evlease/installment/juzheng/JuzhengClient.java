package com.evlease.installment.juzheng;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 聚证公证API客户端
 * 负责Token管理、请求加密、响应解密
 */
@Component
public class JuzhengClient {
  
  private static final Logger log = LoggerFactory.getLogger(JuzhengClient.class);
  private static final long TOKEN_EXPIRE_BUFFER = 300; // 提前5分钟刷新token
  
  private final JuzhengConfig config;
  private final RestTemplate restTemplate;
  private final ObjectMapper objectMapper;
  
  // Token缓存
  private volatile String accessToken;
  private volatile long tokenExpireTime;
  
  public JuzhengClient(JuzhengConfig config) {
    this.config = config;
    this.restTemplate = new RestTemplate();
    this.objectMapper = new ObjectMapper();
  }
  
  /**
   * 获取有效的AccessToken（自动刷新）
   */
  public synchronized String getAccessToken() throws Exception {
    if (accessToken != null && Instant.now().getEpochSecond() < tokenExpireTime - TOKEN_EXPIRE_BUFFER) {
      return accessToken;
    }
    refreshToken();
    return accessToken;
  }
  
  /**
   * 刷新Token
   */
  private void refreshToken() throws Exception {
    String url = config.getBaseUrl() + "/api/notary/client/auth?clientId=" 
        + config.getClientId() + "&clientSecret=" + config.getClientSecret();
    
    ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
    
    if (!response.getStatusCode().is2xxSuccessful()) {
      throw new RuntimeException("获取聚证Token失败: " + response.getStatusCode());
    }
    
    Map<String, Object> result = parseResponse(response.getBody());

    Object codeValue = result.get("code");
    String code = codeValue == null ? null : String.valueOf(codeValue);
    if (!isSuccessCode(code)) {
      throw new RuntimeException("聚证Token获取失败: " + code + " - " + getMessage(result));
    }

    String token = (String) result.get("access_token");
    if (token == null || token.isBlank()) {
      throw new RuntimeException("聚证Token缺失: " + getMessage(result));
    }

    this.accessToken = token;
    this.tokenExpireTime = Instant.now().getEpochSecond() + 7200; // 2小时有效期
    
    log.info("聚证Token刷新成功");
  }
  
  /**
   * 发送加密POST请求
   */
  public Map<String, Object> post(String path, Map<String, Object> params) throws Exception {
    String url = config.getBaseUrl() + path;
    String token = getAccessToken();
    
    // 加密请求参数
    String jsonParams = objectMapper.writeValueAsString(params);
    String encryptedData = JuzhengCryptoUtil.encrypt(jsonParams, config.getPublicKey());
    
    // 构建请求
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.set("Authorization", token);
    
    Map<String, String> body = Map.of("encryptData", encryptedData);
    HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
    
    log.info("聚证API请求: {} params={}", path, params);
    
    ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
    
    if (!response.getStatusCode().is2xxSuccessful()) {
      throw new RuntimeException("聚证API请求失败: " + response.getStatusCode());
    }
    
    Map<String, Object> result = parseResponse(response.getBody());
    
    log.info("聚证API响应: {}", result);
    
    // 检查业务状态码
    Object codeValue = result.get("code");
    String code = codeValue == null ? null : String.valueOf(codeValue);
    if (!isSuccessCode(code)) {
      throw new RuntimeException("聚证业务错误: " + code + " - " + getMessage(result));
    }
    
    return result;
  }
  
  /**
   * 解密回调数据
   */
  public Map<String, Object> decryptCallback(String encryptedData) throws Exception {
    String trimmed = encryptedData == null ? "" : encryptedData.trim();
    
    // 如果是JSON格式，先解析
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      Map<String, Object> json = objectMapper.readValue(trimmed, new TypeReference<>() {});
      
      // 检查是否包含encryptData字段需要解密
      Object encryptData = json.get("encryptData");
      if (encryptData instanceof String s && !s.isBlank()) {
        log.info("解密回调encryptData字段");
        String decrypted = JuzhengCryptoUtil.decrypt(s, config.getPrivateKey());
        return objectMapper.readValue(decrypted, new TypeReference<>() {});
      }
      
      // 直接返回解析后的JSON
      return json;
    }
    
    // 直接是加密字符串
    String decrypted = JuzhengCryptoUtil.decrypt(trimmed, config.getPrivateKey());
    return objectMapper.readValue(decrypted, new TypeReference<>() {});
  }

  private Map<String, Object> parseResponse(String body) throws Exception {
    String trimmed = body == null ? "" : body.trim();
    if (trimmed.isBlank()) return Map.of();

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      Map<String, Object> json = objectMapper.readValue(trimmed, new TypeReference<>() {});
      Object encryptData = json.get("encryptData");
      if (encryptData instanceof String s && !s.isBlank()) {
        String decrypted = JuzhengCryptoUtil.decrypt(s, config.getPrivateKey());
        return objectMapper.readValue(decrypted, new TypeReference<>() {});
      }
      Object data = json.get("data");
      if (data instanceof String s && !s.isBlank()) {
        String dataTrimmed = s.trim();
        if (dataTrimmed.startsWith("{") || dataTrimmed.startsWith("[")) {
          return objectMapper.readValue(dataTrimmed, new TypeReference<>() {});
        }
        try {
          String decrypted = JuzhengCryptoUtil.decrypt(dataTrimmed, config.getPrivateKey());
          return objectMapper.readValue(decrypted, new TypeReference<>() {});
        } catch (Exception ignored) {
          // Fall through to return the raw JSON.
        }
      }
      return json;
    }

    String decrypted = JuzhengCryptoUtil.decrypt(trimmed, config.getPrivateKey());
    return objectMapper.readValue(decrypted, new TypeReference<>() {});
  }

  private String getMessage(Map<String, Object> result) {
    Object message = result.get("message");
    if (message == null) {
      message = result.get("msg");
    }
    return message == null ? null : String.valueOf(message);
  }

  private boolean isSuccessCode(String code) {
    if (code == null || code.isBlank()) {
      return true;
    }
    return "E00000".equals(code) || "0".equals(code) || "200".equals(code);
  }
}
