package com.evlease.installment.asign;

import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.serializer.SerializerFeature;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Calendar;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AsignClient {
  private static final Logger log = LoggerFactory.getLogger(AsignClient.class);
  private final AsignConfig config;
  private final ObjectMapper objectMapper;

  public AsignClient(AsignConfig config) {
    this.config = config;
    this.objectMapper = new ObjectMapper()
      .configure(com.fasterxml.jackson.databind.SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true)
      .configure(com.fasterxml.jackson.databind.MapperFeature.SORT_PROPERTIES_ALPHABETICALLY, true);
  }

  public Map<String, Object> post(String path, Map<String, Object> params) throws Exception {
    String url = config.getBaseUrl() + path;
    Map<String, Object> body = buildRequestBody(params == null ? Map.of() : params);
    String bizData = String.valueOf(body.get("bizData"));
    log.info("Asign API POST {} bizData={}", path, bizData.length() > 3000 ? bizData.substring(0, 3000) + "..." : bizData);
    String response = sendRequest(url, body);
    return parseResponse(response, List.of());
  }

  public Map<String, Object> postList(String path, List<Map<String, Object>> items) throws Exception {
    String url = config.getBaseUrl() + path;
    List<Map<String, Object>> payload = items == null ? List.of() : items;
    Map<String, Object> body = buildRequestBody(payload);
    log.info("Asign API POST {} items={}, bizData={}", path, payload.size(), body.get("bizData"));
    String response = sendRequest(url, body);
    return parseResponse(response, List.of());
  }

  public Map<String, Object> postAllowCodes(String path, Map<String, Object> params, List<String> extraOkCodes) throws Exception {
    String url = config.getBaseUrl() + path;
    Map<String, Object> body = buildRequestBody(params == null ? Map.of() : params);
    log.info("Asign API POST {} params={}", path, body.keySet());
    String response = sendRequest(url, body);
    return parseResponse(response, extraOkCodes);
  }

  private Map<String, Object> buildRequestBody(Object payload) throws Exception {
    String bizData = JSONObject.toJSONString(
      payload == null ? Map.of() : payload,
      SerializerFeature.MapSortField,
      SerializerFeature.DisableCircularReferenceDetect
    );
    if (config.getAppId() != null && !config.getAppId().isBlank()) {
      return Map.of(
        "appId", config.getAppId(),
        "timestamp", String.valueOf(Instant.now().toEpochMilli()),
        "bizData", bizData
      );
    }
    return Map.of(
      "timestamp", String.valueOf(Instant.now().toEpochMilli()),
      "bizData", bizData
    );
  }

  private String sendRequest(String url, Map<String, Object> body) throws Exception {
    String appId = config.getAppId();
    if (appId == null || appId.isBlank()) {
      throw new IllegalStateException("asign appId missing");
    }

    String bizData = String.valueOf(body.get("bizData"));
    long timestamp = resolveTimestamp();
    String timestampText = String.valueOf(timestamp);
    String sign = AsignCryptoUtil.signBizData(bizData, appId, timestampText, config.getPrivateKey(), "SHA1withRSA");
    String boundary = UUID.randomUUID().toString();

    HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
    conn.setReadTimeout(30000);
    conn.setConnectTimeout(30000);
    conn.setDoOutput(true);
    conn.setInstanceFollowRedirects(false);
    conn.setRequestMethod("POST");
    conn.setRequestProperty("Connection", "Keep-Alive");
    conn.setRequestProperty("Charset", "UTF-8");
    conn.setRequestProperty("Content-Type", "multipart/form-data;boundary=" + boundary);
    conn.setUseCaches(false);
    conn.setRequestProperty("sign", sign);
    conn.setRequestProperty("timestamp", timestampText);

    StringBuilder payload = new StringBuilder();
    payload.append(addTextValue("appId", appId, boundary));
    payload.append(addTextValue("timestamp", timestampText, boundary));
    payload.append(addTextValue("bizData", bizData, boundary));

    try (DataOutputStream out = new DataOutputStream(conn.getOutputStream())) {
      out.write(payload.toString().getBytes(StandardCharsets.UTF_8));
      out.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
      out.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
      out.flush();
    }

    int status = conn.getResponseCode();
    InputStream stream = status >= 200 && status < 300 ? conn.getInputStream() : conn.getErrorStream();
    if (stream == null) {
      throw new RuntimeException("Asign API status=" + status);
    }
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
      StringBuilder response = new StringBuilder();
      String line;
      while ((line = reader.readLine()) != null) {
        response.append(line);
      }
      return response.toString();
    }
  }

  private long resolveTimestamp() {
    Calendar calendar = Calendar.getInstance();
    calendar.setTime(new Date());
    calendar.add(Calendar.MINUTE, 10);
    return calendar.getTime().getTime();
  }

  private String addTextValue(String name, String value, String boundary) {
    StringBuilder builder = new StringBuilder();
    builder.append("--").append(boundary).append("\r\n");
    builder.append("Content-Disposition: form-data; name=\"").append(name).append("\"").append("\r\n");
    builder.append("Content-Type: text/plain; charset=UTF-8\r\n");
    builder.append("Content-Transfer-Encoding: 8bit\r\n");
    builder.append("\r\n");
    builder.append(value == null ? "" : value);
    builder.append("\r\n");
    return builder.toString();
  }

  private Map<String, Object> parseResponse(String responseBody, List<String> extraOkCodes) throws Exception {
    String body = responseBody == null ? "" : responseBody.trim();
    log.info("Asign API response: {}", body.length() > 500 ? body.substring(0, 500) + "..." : body);
    if (body.isBlank()) return Map.of();
    Map<String, Object> result = objectMapper.readValue(body, new TypeReference<>() {});
    String code = String.valueOf(result.getOrDefault("code", ""));
    if (!isSuccessCode(code, extraOkCodes)) {
      log.error("Asign API error response: code={}, msg={}, full={}", code, result.get("msg"), body);
      throw new RuntimeException("Asign API error: " + code + " - " + result.get("msg"));
    }
    return result;
  }

  private boolean isSuccessCode(String code, List<String> extraOkCodes) {
    if (code == null || code.isBlank()) return true;
    // 爱签API成功码是 100000，不是 0（code=0 表示参数异常等错误）
    if ("100000".equals(code) || "200".equals(code)) return true;
    return extraOkCodes != null && extraOkCodes.contains(code);
  }

}
