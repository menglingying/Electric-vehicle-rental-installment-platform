package com.evlease.installment.juzheng;

import javax.crypto.Cipher;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * 聚证公证RSA加解密工具类
 * 使用RSA加密请求参数，解密响应数据
 */
public class JuzhengCryptoUtil {
  
  private static final String RSA_ALGORITHM = "RSA";
  private static final String CIPHER_ALGORITHM = "RSA/ECB/PKCS1Padding";
  private static final int MAX_ENCRYPT_BLOCK = 117; // RSA 1024位密钥最大加密块
  private static final int MAX_DECRYPT_BLOCK = 128; // RSA 1024位密钥最大解密块
  
  /**
   * 使用公钥加密数据
   */
  public static String encrypt(String data, String publicKeyStr) throws Exception {
    PublicKey publicKey = getPublicKey(publicKeyStr);
    Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
    cipher.init(Cipher.ENCRYPT_MODE, publicKey);
    
    byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
    byte[] encryptedData = doFinal(cipher, dataBytes, MAX_ENCRYPT_BLOCK);
    return Base64.getEncoder().encodeToString(encryptedData);
  }
  
  /**
   * 使用私钥解密数据
   */
  public static String decrypt(String encryptedData, String privateKeyStr) throws Exception {
    PrivateKey privateKey = getPrivateKey(privateKeyStr);
    Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
    cipher.init(Cipher.DECRYPT_MODE, privateKey);
    
    byte[] dataBytes = Base64.getDecoder().decode(encryptedData);
    byte[] decryptedData = doFinal(cipher, dataBytes, MAX_DECRYPT_BLOCK);
    return new String(decryptedData, StandardCharsets.UTF_8);
  }
  
  /**
   * 分段加解密处理
   */
  private static byte[] doFinal(Cipher cipher, byte[] data, int maxBlock) throws Exception {
    int inputLen = data.length;
    java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
    int offset = 0;
    
    while (inputLen - offset > 0) {
      int blockSize = Math.min(inputLen - offset, maxBlock);
      byte[] block = cipher.doFinal(data, offset, blockSize);
      out.write(block);
      offset += blockSize;
    }
    
    byte[] result = out.toByteArray();
    out.close();
    return result;
  }
  
  /**
   * 从Base64字符串获取公钥
   */
  private static PublicKey getPublicKey(String publicKeyStr) throws Exception {
    byte[] keyBytes = Base64.getDecoder().decode(publicKeyStr);
    X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);
    KeyFactory keyFactory = KeyFactory.getInstance(RSA_ALGORITHM);
    return keyFactory.generatePublic(keySpec);
  }
  
  /**
   * 从Base64字符串获取私钥
   */
  private static PrivateKey getPrivateKey(String privateKeyStr) throws Exception {
    byte[] keyBytes = Base64.getDecoder().decode(privateKeyStr);
    PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(keyBytes);
    KeyFactory keyFactory = KeyFactory.getInstance(RSA_ALGORITHM);
    return keyFactory.generatePrivate(keySpec);
  }
}
