package com.evlease.installment.controller.admin;

import com.evlease.installment.common.ApiException;
import com.evlease.installment.juzheng.NotaryService;
import com.evlease.installment.model.Order;
import com.evlease.installment.repo.ContractRepository;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.service.OrderLogService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/notary")
public class AdminNotaryController {
  private final OrderRepository orderRepository;
  private final ContractRepository contractRepository;
  private final OrderLogService orderLogService;
  private final NotaryService notaryService;

  public AdminNotaryController(
    OrderRepository orderRepository,
    ContractRepository contractRepository,
    OrderLogService orderLogService,
    NotaryService notaryService
  ) {
    this.orderRepository = orderRepository;
    this.contractRepository = contractRepository;
    this.orderLogService = orderLogService;
    this.notaryService = notaryService;
  }

  @PostMapping("/{orderId}/apply")
  public Map<String, Object> apply(@PathVariable String orderId) {
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (!order.isKycCompleted()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "客户未完成KYC，无法发起公证");
    }
    if (order.getNotaryOrderNo() != null && !order.getNotaryOrderNo().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "已发起公证申请");
    }

    try {
      String outOrderNo = notaryService.applyLeaseNotary(order);
      order.setNotaryOrderNo(outOrderNo);
      order.setNotaryStatus("10");
      orderLogService.add(order, "NOTARY_APPLY", "ADMIN", l -> l.setActor("手动发起"));
      orderRepository.save(order);
      return Map.of("success", true, "outOrderNo", outOrderNo);
    } catch (Exception ex) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "公证发起失败: " + ex.getMessage());
    }
  }

  @GetMapping("/{orderId}/status")
  public Map<String, Object> status(@PathVariable String orderId) {
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    return Map.of(
      "notaryOrderNo", order.getNotaryOrderNo() == null ? "" : order.getNotaryOrderNo(),
      "notaryStatus", order.getNotaryStatus() == null ? "" : order.getNotaryStatus(),
      "notaryStatusText", getNotaryStatusText(order.getNotaryStatus()),
      "notaryCertifiedTime", order.getNotaryCertifiedTime() == null ? "" : order.getNotaryCertifiedTime(),
      "notaryName", order.getNotaryName() == null ? "" : order.getNotaryName(),
      "notaryCertUrl", order.getNotaryCertUrl() == null ? "" : order.getNotaryCertUrl()
    );
  }

  @PostMapping("/{orderId}/refresh")
  public Map<String, Object> refresh(@PathVariable String orderId) {
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (order.getNotaryOrderNo() == null || order.getNotaryOrderNo().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "未发起公证");
    }

    try {
      var info = notaryService.getOrderInfo(order.getNotaryOrderNo());
      Object status = info.get("orderStatus");
      if (status != null) order.setNotaryStatus(String.valueOf(status));
      Object certifiedTime = info.get("certifiedTime");
      if (certifiedTime != null) order.setNotaryCertifiedTime(String.valueOf(certifiedTime));
      Object notaryName = info.get("notaryName");
      if (notaryName != null) order.setNotaryName(String.valueOf(notaryName));
      orderRepository.save(order);
      orderLogService.add(order, "NOTARY_REFRESH", "ADMIN");
      return Map.of("success", true, "notaryStatus", order.getNotaryStatus());
    } catch (Exception ex) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "查询公证状态失败: " + ex.getMessage());
    }
  }

  @PostMapping("/{orderId}/cert-url")
  public Map<String, Object> fetchCertUrl(@PathVariable String orderId) {
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (order.getNotaryOrderNo() == null || order.getNotaryOrderNo().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "未发起公证");
    }

    try {
      var result = notaryService.getNotarizationDownloadUrl(order.getNotaryOrderNo());
      String url = extractUrl(result);
      if (url == null || url.isBlank()) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "未获取到证书下载链接");
      }
      order.setNotaryCertUrl(url);
      orderRepository.save(order);
      var contract = contractRepository.findById(order.getId()).orElse(null);
      if (contract != null) {
        contract.setNotaryCertUrl(url);
        contractRepository.save(contract);
      }
      orderLogService.add(order, "NOTARY_CERT_URL", "ADMIN");
      return Map.of("success", true, "url", url);
    } catch (Exception ex) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "获取证书链接失败: " + ex.getMessage());
    }
  }

  /**
   * 获取公证签署链接（H5）
   */
  @GetMapping("/{orderId}/sign-url")
  public Map<String, Object> getSignUrl(@PathVariable String orderId) {
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (order.getNotaryOrderNo() == null || order.getNotaryOrderNo().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "未发起公证");
    }
    if (order.getIdCardNumber() == null || order.getIdCardNumber().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "客户身份证号不存在");
    }

    try {
      String signUrl = notaryService.getH5SignUrl(order.getNotaryOrderNo(), order.getIdCardNumber());
      return Map.of("success", true, "signUrl", signUrl);
    } catch (Exception ex) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "获取签署链接失败: " + ex.getMessage());
    }
  }

  /**
   * 获取公证小程序链接
   */
  @GetMapping("/{orderId}/open-link")
  public Map<String, Object> getOpenLink(@PathVariable String orderId) {
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (order.getNotaryOrderNo() == null || order.getNotaryOrderNo().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "未发起公证");
    }
    if (order.getIdCardNumber() == null || order.getIdCardNumber().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "客户身份证号不存在");
    }

    try {
      String openLink = notaryService.getOpenLink(order.getNotaryOrderNo(), order.getIdCardNumber());
      return Map.of("success", true, "openLink", openLink);
    } catch (Exception ex) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "获取小程序链接失败: " + ex.getMessage());
    }
  }

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
      case "FAILED" -> "发起失败";
      default -> "未知状态";
    };
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
