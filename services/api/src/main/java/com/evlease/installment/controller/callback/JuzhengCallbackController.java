package com.evlease.installment.controller.callback;

import com.evlease.installment.juzheng.JuzhengClient;
import com.evlease.installment.juzheng.NotaryService;
import com.evlease.installment.model.Order;
import com.evlease.installment.repo.ContractRepository;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.service.OrderLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 聚证公证回调Controller
 * 处理聚证平台的异步通知
 */
@RestController
@RequestMapping("/api/callback/juzheng")
public class JuzhengCallbackController {
  
  private static final Logger log = LoggerFactory.getLogger(JuzhengCallbackController.class);
  
  private final JuzhengClient juzhengClient;
  private final NotaryService notaryService;
  private final OrderRepository orderRepository;
  private final ContractRepository contractRepository;
  private final OrderLogService orderLogService;
  
  public JuzhengCallbackController(
      JuzhengClient juzhengClient,
      NotaryService notaryService,
      OrderRepository orderRepository,
      ContractRepository contractRepository,
      OrderLogService orderLogService
  ) {
    this.juzhengClient = juzhengClient;
    this.notaryService = notaryService;
    this.orderRepository = orderRepository;
    this.contractRepository = contractRepository;
    this.orderLogService = orderLogService;
  }
  
  /**
   * 聚证公证回调入口
   * 回调数据是加密的字符串
   */
  @PostMapping
  public String callback(@RequestBody String encryptedData) {
    try {
      log.info("收到聚证回调: {}", encryptedData.substring(0, Math.min(100, encryptedData.length())));
      
      // 解密回调数据
      Map<String, Object> data = juzhengClient.decryptCallback(encryptedData);
      log.info("聚证回调解密: {}", data);
      
      String eventType = (String) data.get("eventType");
      if (eventType == null) {
        log.warn("聚证回调缺少eventType");
        return "SUCCESS";
      }
      
      // 聚证回调数据结构：顶层有 eventType，业务数据在 businessData 子对象内
      Map<String, Object> bd = extractBusinessData(data);

      switch (eventType) {
        case "4000" -> handleOrderCreated(bd);      // 订单发起回调
        case "4001" -> handleOrderUpdated(bd);      // 订单更新通知
        case "3000" -> handleOrderCertified(bd);    // 订单出证通知
        case "9000" -> handleSignResult(bd);        // 签署结果通知
        case "2600" -> handleVideoAuditComplete(bd);// 视频审核完成
        case "2601" -> handleVideoSubmitted(bd);    // 视频信息提交
        default -> log.info("未处理的聚证回调事件: {}", eventType);
      }
      
      return "SUCCESS";
    } catch (Exception e) {
      log.error("处理聚证回调异常", e);
      return "SUCCESS"; // 即使异常也返回SUCCESS，避免重复回调
    }
  }
  
  /**
   * 4000-订单发起回调
   */
  private void handleOrderCreated(Map<String, Object> data) {
    String outOrderNo = (String) data.get("outOrderNo");
    String resultCode = (String) data.get("resultCode");
    String orderStatus = (String) data.get("orderStatus");
    
    log.info("订单发起回调: outOrderNo={}, resultCode={}, orderStatus={}", outOrderNo, resultCode, orderStatus);
    
    Order order = findOrderByNotaryOrderNo(outOrderNo);
    if (order == null) return;
    
    if ("E00000".equals(resultCode)) {
      order.setNotaryStatus(orderStatus);
      orderLogService.add(order, "NOTARY_CREATED", "CALLBACK", l -> l.setActor("公证订单创建成功"));
    } else {
      order.setNotaryStatus("FAILED");
      orderLogService.add(order, "NOTARY_FAILED", "CALLBACK", l -> l.setActor("公证订单创建失败: " + resultCode));
    }
    orderRepository.save(order);
  }
  
  /**
   * 4001-订单更新通知
   */
  private void handleOrderUpdated(Map<String, Object> data) {
    String outOrderNo = (String) data.get("outOrderNo");
    String orderStatus = (String) data.get("orderStatus");
    String orderDesc = (String) data.get("orderDesc");
    
    log.info("订单更新通知: outOrderNo={}, orderStatus={}", outOrderNo, orderStatus);
    
    Order order = findOrderByNotaryOrderNo(outOrderNo);
    if (order == null) return;
    
    order.setNotaryStatus(orderStatus);
    orderLogService.add(order, "NOTARY_UPDATED", "CALLBACK", l -> l.setActor("公证状态更新: " + orderStatus + (orderDesc != null ? " - " + orderDesc : "")));
    orderRepository.save(order);
  }
  
  /**
   * 3000-订单出证通知
   */
  private void handleOrderCertified(Map<String, Object> data) {
    String outOrderNo = (String) data.get("outOrderNo");
    String certifiedTime = (String) data.get("certifiedTime");
    String notaryName = (String) data.get("notaryName");
    
    log.info("订单出证通知: outOrderNo={}, certifiedTime={}, notaryName={}", outOrderNo, certifiedTime, notaryName);
    
    Order order = findOrderByNotaryOrderNo(outOrderNo);
    if (order == null) return;
    
    order.setNotaryStatus("33"); // 已出证
    order.setNotaryCertifiedTime(certifiedTime);
    order.setNotaryName(notaryName);

    // 获取公证证书下载链接（失败不影响回调）
    try {
      var result = notaryService.getNotarizationDownloadUrl(outOrderNo);
      String url = extractUrl(result);
      if (url != null && !url.isBlank()) {
        order.setNotaryCertUrl(url);
        var contract = contractRepository.findById(order.getId()).orElse(null);
        if (contract != null) {
          contract.setNotaryCertUrl(url);
          contractRepository.save(contract);
        }
      }
    } catch (Exception ex) {
      log.warn("获取公证证书链接失败: {}", ex.getMessage());
    }

    orderLogService.add(order, "NOTARY_CERTIFIED", "CALLBACK", l -> l.setActor("公证书已出证，公证员: " + notaryName));
    orderRepository.save(order);
  }
  
  /**
   * 9000-签署结果通知
   */
  private void handleSignResult(Map<String, Object> data) {
    String outOrderNo = (String) data.get("outOrderNo");
    String signResult = (String) data.get("signResult");
    String partyName = (String) data.get("partyName");
    
    log.info("签署结果通知: outOrderNo={}, signResult={}, partyName={}", outOrderNo, signResult, partyName);
    
    Order order = findOrderByNotaryOrderNo(outOrderNo);
    if (order == null) return;
    
    if ("1".equals(signResult)) {
      orderLogService.add(order, "NOTARY_SIGNED", "CALLBACK", l -> l.setActor(partyName + " 签署成功"));
    } else {
      orderLogService.add(order, "NOTARY_SIGN_FAILED", "CALLBACK", l -> l.setActor(partyName + " 签署失败"));
    }
    orderRepository.save(order);
  }
  
  /**
   * 2600-视频审核完成
   */
  private void handleVideoAuditComplete(Map<String, Object> data) {
    String outOrderNo = (String) data.get("outOrderNo");
    log.info("视频审核完成: outOrderNo={}", outOrderNo);
    
    Order order = findOrderByNotaryOrderNo(outOrderNo);
    if (order == null) return;
    
    orderLogService.add(order, "NOTARY_VIDEO_AUDIT", "CALLBACK", l -> l.setActor("视频审核完成"));
    orderRepository.save(order);
  }
  
  /**
   * 2601-视频信息提交
   */
  private void handleVideoSubmitted(Map<String, Object> data) {
    String outOrderNo = (String) data.get("outOrderNo");
    log.info("视频信息提交: outOrderNo={}", outOrderNo);
    
    Order order = findOrderByNotaryOrderNo(outOrderNo);
    if (order == null) return;
    
    orderLogService.add(order, "NOTARY_VIDEO_SUBMIT", "CALLBACK", l -> l.setActor("视频信息已提交"));
    orderRepository.save(order);
  }
  
  /**
   * 提取 businessData 子对象（聚证回调将业务字段嵌套在 businessData 内）
   */
  @SuppressWarnings("unchecked")
  private Map<String, Object> extractBusinessData(Map<String, Object> data) {
    Object bd = data.get("businessData");
    if (bd instanceof Map<?, ?>) {
      Map<String, Object> result = new HashMap<>();
      ((Map<?, ?>) bd).forEach((k, v) -> result.put(String.valueOf(k), v));
      return result;
    }
    return data;
  }

  /**
   * 根据公证订单号查找订单
   */
  private Order findOrderByNotaryOrderNo(String notaryOrderNo) {
    if (notaryOrderNo == null) return null;
    return orderRepository.findByNotaryOrderNo(notaryOrderNo).orElse(null);
  }

  private String extractUrl(Map<String, Object> result) {
    if (result == null) return null;
    Object direct = result.get("fileUrl");
    if (direct == null) direct = result.get("downloadUrl");
    if (direct == null) direct = result.get("url");
    if (direct != null) return String.valueOf(direct);

    Object data = result.get("data");
    if (data instanceof Map<?, ?> map) {
      Object nested = map.get("fileUrl");
      if (nested == null) nested = map.get("downloadUrl");
      if (nested == null) nested = map.get("url");
      if (nested != null) return String.valueOf(nested);
    }
    return null;
  }
}
