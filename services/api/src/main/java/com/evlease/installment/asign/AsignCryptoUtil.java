package com.evlease.installment.asign;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class AsignCryptoUtil {
  private static final ObjectMapper mapper = new ObjectMapper()
    .configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);

  private AsignCryptoUtil() {}

  public static String sign(Map<String, Object> params, String privateKey) throws Exception {
    String json = toSortedJson(params);
    return signString(json, privateKey, "SHA1withRSA");
  }

  public static String signBizData(String bizData, String appId, String timestamp, String privateKey, String algorithm) throws Exception {
    String signString = bizData + md5Hex(bizData) + appId + timestamp;
    return signString(signString, privateKey, algorithm);
  }

  public static boolean verify(Map<String, Object> params, String sign, String publicKey) throws Exception {
    if (sign == null || sign.isBlank()) return false;
    String json = toSortedJson(params);
    return verifyString(json, sign, publicKey, "SHA1withRSA");
  }

  public static boolean verifyAuthCallback(
    String name,
    String idNo,
    String serialNo,
    String result,
    String sign,
    String publicKey
  ) throws Exception {
    if (sign == null || sign.isBlank()) return false;
    if (serialNo == null || serialNo.isBlank()) return false;
    if (result == null || result.isBlank()) return false;
    String md5 = md5Hex((name == null ? "" : name) + (idNo == null ? "" : idNo));
    String signString = md5 + serialNo + result;
    return verifyString(signString, sign, publicKey, "SHA1withRSA");
  }

  public static String toSortedJson(Map<String, Object> params) throws Exception {
    Map<String, Object> normalized = normalize(params);
    return mapper.writeValueAsString(normalized);
  }

  @SuppressWarnings("unchecked")
  private static Map<String, Object> normalize(Map<String, Object> params) {
    if (params == null) return Map.of();
    TreeMap<String, Object> sorted = new TreeMap<>();
    for (Map.Entry<String, Object> entry : params.entrySet()) {
      String key = entry.getKey();
      if (key == null) continue;
      sorted.put(key, normalizeValue(entry.getValue()));
    }
    return sorted;
  }

  @SuppressWarnings("unchecked")
  private static Object normalizeValue(Object value) {
    if (value instanceof Map<?, ?> mapValue) {
      Map<String, Object> normalized = new LinkedHashMap<>();
      for (Map.Entry<?, ?> entry : mapValue.entrySet()) {
        if (entry.getKey() == null) continue;
        normalized.put(String.valueOf(entry.getKey()), normalizeValue(entry.getValue()));
      }
      return normalize(normalized);
    }
    if (value instanceof List<?> listValue) {
      List<Object> normalized = new ArrayList<>();
      for (Object item : listValue) {
        normalized.add(normalizeValue(item));
      }
      return normalized;
    }
    return value;
  }

  private static PrivateKey loadPrivateKey(String rawKey) throws Exception {
    byte[] decoded = Base64.getDecoder().decode(cleanKey(rawKey));
    PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
    return KeyFactory.getInstance("RSA").generatePrivate(spec);
  }

  private static PublicKey loadPublicKey(String rawKey) throws Exception {
    byte[] decoded = Base64.getDecoder().decode(cleanKey(rawKey));
    X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);
    return KeyFactory.getInstance("RSA").generatePublic(spec);
  }

  private static String cleanKey(String rawKey) {
    if (rawKey == null) return "";
    return rawKey
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace("-----BEGIN PUBLIC KEY-----", "")
      .replace("-----END PUBLIC KEY-----", "")
      .replaceAll("\\s+", "");
  }

  private static String signString(String data, String privateKey, String algorithm) throws Exception {
    Signature signature = Signature.getInstance(algorithm);
    signature.initSign(loadPrivateKey(privateKey));
    signature.update(data.getBytes(StandardCharsets.UTF_8));
    String encoded = Base64.getEncoder().encodeToString(signature.sign());
    return encoded.replace("\r", "").replace("\n", "");
  }

  private static boolean verifyString(String data, String sign, String publicKey, String algorithm) throws Exception {
    Signature signature = Signature.getInstance(algorithm);
    signature.initVerify(loadPublicKey(publicKey));
    signature.update(data.getBytes(StandardCharsets.UTF_8));
    // 修复：签名中的 + 可能被URL解码成空格，需要还原
    String cleanedSign = sign.replace(" ", "+").replace("\r", "").replace("\n", "");
    return signature.verify(Base64.getDecoder().decode(cleanedSign));
  }

  private static String md5Hex(String input) throws Exception {
    MessageDigest md = MessageDigest.getInstance("MD5");
    byte[] digest = md.digest(input == null ? new byte[0] : input.getBytes(StandardCharsets.UTF_8));
    StringBuilder sb = new StringBuilder(digest.length * 2);
    for (byte b : digest) {
      sb.append(String.format("%02x", b));
    }
    return sb.toString();
  }
}
