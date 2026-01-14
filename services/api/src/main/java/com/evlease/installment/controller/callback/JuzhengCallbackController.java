package com.evlease.installment.controller.callback;

import com.evlease.installment.juzheng.JuzhengClient;
import com.evlease.installment.model.Order;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.service.OrderLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

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
  private final OrderRepository orderRepository;
  private final OrderLogService orderLogService;
  
  public JuzhengCallbackController(
      JuzhengClient juzhengClient,
      OrderRepository orderRepository,
      OrderLogService orderLogService
  ) {
    this.juzhengClient = juzhengClient;
    this.orderRepository = orderRepository;
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
      
      switch (eventType) {
        case "4000" -> handleOrderCreated(data);      // 订单发起回调
        case "4001" -> handleOrderUpdated(data);      // 订单更新通知
        case "3000" -> handleOrderCertified(data);    // 订单出证通知
        case "9000" -> handleSignResult(data);        // 签署结果通知
        case "2600" -> handleVideoAuditComplete(data);// 视频审核完成
        case "2601" -> handleVideoSubmitted(data);    // 视频信息提交
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
   * 根据公证订单号查找订单
   */
  private Order findOrderByNotaryOrderNo(String notaryOrderNo) {
    if (notaryOrderNo == null) return null;
    return orderRepository.findByNotaryOrderNo(notaryOrderNo).orElse(null);
  }
}
