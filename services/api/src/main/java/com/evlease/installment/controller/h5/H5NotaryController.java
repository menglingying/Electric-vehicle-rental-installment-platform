package com.evlease.installment.controller.h5;

import com.evlease.installment.auth.AuthContext;
import com.evlease.installment.auth.PrincipalType;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.juzheng.NotaryService;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.service.OrderLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * H5公证签署Controller
 * 提供发起公证、获取签署链接等接口
 */
@RestController
@RequestMapping("/api/h5/notary")
public class H5NotaryController {
  
  private static final Logger log = LoggerFactory.getLogger(H5NotaryController.class);
  
  private final NotaryService notaryService;
  private final OrderRepository orderRepository;
  private final OrderLogService orderLogService;
  
  public H5NotaryController(
      NotaryService notaryService,
      OrderRepository orderRepository,
      OrderLogService orderLogService
  ) {
    this.notaryService = notaryService;
    this.orderRepository = orderRepository;
    this.orderLogService = orderLogService;
  }
  
  /**
   * 发起公证申请
   */
  @PostMapping("/{orderId}/apply")
  public Map<String, Object> applyNotary(HttpServletRequest request, @PathVariable String orderId) {
    var principal = AuthContext.require(request, PrincipalType.H5);
    var order = orderRepository.findById(orderId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    
    if (!order.getPhone().equals(principal.phoneOrUsername())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "无权限");
    }
    
    // 检查KYC是否完成
    if (!order.isKycCompleted()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "请先完成身份认证");
    }
    
    // 检查是否已发起公证
    if (order.getNotaryOrderNo() != null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "已发起公证申请");
    }
    
    try {
      // 发起公证（身份证图片需要先上传到聚证获取fileId，这里简化处理）
      String idCardFrontFileId = "placeholder_front"; // TODO: 实际需要上传文件
      String idCardBackFileId = "placeholder_back";
      
      String outOrderNo = notaryService.applyLeaseNotary(order, idCardFrontFileId, idCardBackFileId);
      
      order.setNotaryOrderNo(outOrderNo);
      order.setNotaryStatus("10"); // 预审中
      orderLogService.add(order, "NOTARY_APPLY", "H5", l -> l.setActor("发起公证申请"));
      orderRepository.save(order);
      
      return Map.of("success", true, "outOrderNo", outOrderNo);
    } catch (Exception e) {
      log.error("发起公证失败", e);
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "发起公证失败: " + e.getMessage());
    }
  }
  
  /**
   * 获取签署链接
   */
  @GetMapping("/{orderId}/sign-url")
  public Map<String, Object> getSignUrl(HttpServletRequest request, @PathVariable String orderId) {
    var principal = AuthContext.require(request, PrincipalType.H5);
    var order = orderRepository.findById(orderId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    
    if (!order.getPhone().equals(principal.phoneOrUsername())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "无权限");
    }
    
    if (order.getNotaryOrderNo() == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "请先发起公证申请");
    }
    
    // 只有申办中状态才能获取签署链接
    if (!"20".equals(order.getNotaryStatus())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "当前状态不支持签署");
    }
    
    try {
      String signUrl = notaryService.getH5SignUrl(order.getNotaryOrderNo(), order.getIdCardNumber());
      return Map.of("signUrl", signUrl);
    } catch (Exception e) {
      log.error("获取签署链接失败", e);
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "获取签署链接失败: " + e.getMessage());
    }
  }
  
  /**
   * 查询公证状态
   */
  @GetMapping("/{orderId}/status")
  public Map<String, Object> getNotaryStatus(HttpServletRequest request, @PathVariable String orderId) {
    var principal = AuthContext.require(request, PrincipalType.H5);
    var order = orderRepository.findById(orderId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    
    if (!order.getPhone().equals(principal.phoneOrUsername())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "无权限");
    }
    
    return Map.of(
        "notaryOrderNo", order.getNotaryOrderNo() != null ? order.getNotaryOrderNo() : "",
        "notaryStatus", order.getNotaryStatus() != null ? order.getNotaryStatus() : "",
        "notaryStatusText", getNotaryStatusText(order.getNotaryStatus()),
        "notaryCertifiedTime", order.getNotaryCertifiedTime() != null ? order.getNotaryCertifiedTime() : "",
        "notaryName", order.getNotaryName() != null ? order.getNotaryName() : ""
    );
  }
  
  /**
   * 获取公证状态文本
   */
  private String getNotaryStatusText(String status) {
    if (status == null) return "未发起";
    return switch (status) {
      case "10" -> "预审中";
      case "11" -> "预审不通过";
      case "20" -> "申办中";
      case "21" -> "申办终止";
      case "22" -> "申办成功";
      case "23" -> "申办完结";
      case "31" -> "受理中";
      case "33" -> "已出证";
      case "34" -> "异常终止";
      default -> "未知状态";
    };
  }
}
