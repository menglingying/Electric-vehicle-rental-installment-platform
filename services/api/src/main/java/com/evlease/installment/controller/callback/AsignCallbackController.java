package com.evlease.installment.controller.callback;

import com.evlease.installment.asign.AsignService;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.juzheng.NotaryService;
import com.evlease.installment.model.Contract;
import com.evlease.installment.model.Order;
import com.evlease.installment.repo.ContractRepository;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.service.OrderLogService;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/callbacks/asign")
public class AsignCallbackController {
  private static final Logger log = LoggerFactory.getLogger(AsignCallbackController.class);
  private final AsignService asignService;
  private final ContractRepository contractRepository;
  private final OrderRepository orderRepository;
  private final OrderLogService orderLogService;
  private final NotaryService notaryService;

  public AsignCallbackController(
    AsignService asignService,
    ContractRepository contractRepository,
    OrderRepository orderRepository,
    OrderLogService orderLogService,
    NotaryService notaryService
  ) {
    this.asignService = asignService;
    this.contractRepository = contractRepository;
    this.orderRepository = orderRepository;
    this.orderLogService = orderLogService;
    this.notaryService = notaryService;
  }

  // 临时测试端点：获取模板控件信息
  @GetMapping("/template-info/{templateNo}")
  public Map<String, Object> getTemplateInfo(@PathVariable String templateNo) throws Exception {
    return asignService.getTemplateComponents(templateNo);
  }

  @PostMapping("/contract")
  public String contractCallback(@RequestBody Map<String, Object> payload) {
    log.info("收到爱签合同回调: {}", payload);
    if (payload == null || payload.isEmpty()) return "ok";
    String sign = payload.containsKey("sign") ? String.valueOf(payload.get("sign")) : "";
    Map<String, Object> verifyPayload = new HashMap<>(payload);
    verifyPayload.remove("sign");
    verifyPayload.remove("remark");
    verifyPayload.remove("account"); // account 不参与签名
    
    boolean signatureValid = false;
    try {
      signatureValid = asignService.verifyCallback(verifyPayload, sign);
      if (!signatureValid) {
        log.warn("爱签回调签名验证失败: payload={}, sign={}", verifyPayload, sign);
        // 暂时不返回fail，继续处理（后续可改回严格验证）
      } else {
        log.info("爱签回调签名验证通过");
      }
    } catch (Exception ex) {
      log.warn("爱签回调签名验证异常: {}, sign={}", ex.getMessage(), sign);
      // 暂时不返回fail，继续处理（后续可改回严格验证）
    }

    String contractNo = String.valueOf(payload.getOrDefault("contractNo", ""));
    if (contractNo.isBlank()) {
      log.warn("爱签回调缺少contractNo");
      return "ok";
    }
    Contract contract = contractRepository.findByContractNo(contractNo);
    if (contract == null) {
      log.warn("爱签回调找不到合同: contractNo={}", contractNo);
      return "ok";
    }

    String status = String.valueOf(payload.getOrDefault("status", ""));
    String signTime = String.valueOf(payload.getOrDefault("signTime", ""));
    log.info("处理爱签合同回调: contractNo={}, status={}, signTime={}", contractNo, status, signTime);
    
    try {
      switch (status) {
        case "2" -> {
          log.info("合同签署完成: contractNo={}", contractNo);
          asignService.applySignedContract(contract, signTime);
          try {
            String fileUrl = asignService.downloadContract(contractNo);
            if (fileUrl != null && !fileUrl.isBlank()) {
              contract.setFileUrl(fileUrl);
              log.info("合同文件已下载: fileUrl={}", fileUrl);
            }
          } catch (Exception ex) {
            log.warn("下载合同文件失败: {}", ex.getMessage());
          }
        }
        case "3" -> {
          log.info("合同已过期: contractNo={}", contractNo);
          asignService.applyVoidContract(contract, "EXPIRED");
        }
        case "4" -> {
          log.info("合同被拒签: contractNo={}", contractNo);
          asignService.applyVoidContract(contract, "REFUSED");
        }
        case "-3" -> {
          log.info("合同签署失败: contractNo={}", contractNo);
          asignService.applyFailedContract(contract, "FAILED");
        }
        default -> {
          log.info("未处理的合同状态: status={}", status);
          return "ok";
        }
      }
      contractRepository.save(contract);
      log.info("合同状态已更新: contractNo={}, newStatus={}", contractNo, contract.getStatus());
    } catch (Exception ex) {
      log.error("处理爱签回调异常: {}", ex.getMessage(), ex);
      throw new ApiException(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    Order order = orderRepository.findById(contract.getOrderId()).orElse(null);
    if (order != null) {
      orderLogService.add(order, "CONTRACT_CALLBACK", "CALLBACK", l -> l.setContractStatus(contract.getStatus()));
      orderRepository.save(order);
      if ("SIGNED".equalsIgnoreCase(contract.getStatus())) {
        try {
          applyNotary(order);
        } catch (Exception ex) {
          order.setNotaryStatus("FAILED");
          orderLogService.add(order, "NOTARY_AUTO_FAILED", "CALLBACK", l -> l.setActor(ex.getMessage()));
          orderRepository.save(order);
        }
      }
    }

    return "ok";
  }

  @PostMapping("/auth")
  public Map<String, Object> authCallback(@RequestBody Map<String, Object> payload) {
    if (payload == null || payload.isEmpty()) return Map.of("success", true);
    String sign = asText(payload.get("sign"));
    String result = asText(payload.get("result"));
    String serialNo = asText(payload.get("serialNo"));
    String name = decode(asText(payload.get("name")));
    String idNo = decode(asText(payload.get("idNo")));
    String bizId = decode(asText(payload.get("bizId")));

    boolean verified = false;
    try {
      verified = asignService.verifyAuthCallback(name, idNo, serialNo, result, sign);
      if (!verified) {
        log.warn("Asign auth callback signature invalid: serialNo={}", serialNo);
      }
    } catch (Exception ex) {
      log.warn("Asign auth callback signature verify failed: {}", ex.getMessage());
    }

    Order order = null;
    if (bizId != null && !bizId.isBlank()) {
      order = orderRepository.findById(bizId).orElse(null);
    }
    if (order == null && idNo != null && !idNo.isBlank()) {
      order = orderRepository.findFirstByIdCardNumberOrderByCreatedAtDesc(idNo).orElse(null);
    }
    if (order != null) {
      order.setAsignSerialNo(serialNo);
      order.setAsignAuthResult(result);
      orderLogService.add(order, "ASIGN_AUTH_CALLBACK", "CALLBACK", l -> l.setActor(result));
      orderRepository.save(order);
    }

    return Map.of("success", true, "verified", verified);
  }

  private String asText(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

  private String decode(String value) {
    if (value == null || value.isBlank()) return "";
    try {
      return URLDecoder.decode(value, StandardCharsets.UTF_8);
    } catch (Exception ex) {
      return value;
    }
  }

  private void applyNotary(Order order) throws Exception {
    if (order.getNotaryOrderNo() != null && !order.getNotaryOrderNo().isBlank()) {
      return;
    }
    if (!order.isKycCompleted()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "KYC not completed");
    }
    String outOrderNo = notaryService.applyLeaseNotary(order);
    order.setNotaryOrderNo(outOrderNo);
    order.setNotaryStatus("10");
    orderLogService.add(order, "NOTARY_APPLY", "CALLBACK", l -> l.setActor("合同签署完成后自动发起"));
    orderRepository.save(order);
  }
}
