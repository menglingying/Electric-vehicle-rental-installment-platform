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
    
    // 响应是加密的，需要解密
    String decrypted = JuzhengCryptoUtil.decrypt(response.getBody(), config.getPrivateKey());
    Map<String, Object> result = objectMapper.readValue(decrypted, new TypeReference<>() {});
    
    this.accessToken = (String) result.get("access_token");
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
    
    // 解密响应
    String decrypted = JuzhengCryptoUtil.decrypt(response.getBody(), config.getPrivateKey());
    Map<String, Object> result = objectMapper.readValue(decrypted, new TypeReference<>() {});
    
    log.info("聚证API响应: {}", result);
    
    // 检查业务状态码
    String code = (String) result.get("code");
    if (code != null && !"E00000".equals(code)) {
      throw new RuntimeException("聚证业务错误: " + code + " - " + result.get("message"));
    }
    
    return result;
  }
  
  /**
   * 解密回调数据
   */
  public Map<String, Object> decryptCallback(String encryptedData) throws Exception {
    String decrypted = JuzhengCryptoUtil.decrypt(encryptedData, config.getPrivateKey());
    return objectMapper.readValue(decrypted, new TypeReference<>() {});
  }
}
