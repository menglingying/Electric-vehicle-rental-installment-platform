package com.evlease.installment.controller.h5;

import com.evlease.installment.asign.AsignService;
import com.evlease.installment.auth.AuthContext;
import com.evlease.installment.auth.PrincipalType;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.model.Contract;
import com.evlease.installment.repo.ContractRepository;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.service.OrderLogService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/h5/contracts")
public class H5ContractController {
  private static final Logger log = LoggerFactory.getLogger(H5ContractController.class);
  private final OrderRepository orderRepository;
  private final ContractRepository contractRepository;
  private final OrderLogService orderLogService;
  private final AsignService asignService;

  public H5ContractController(
    OrderRepository orderRepository,
    ContractRepository contractRepository,
    OrderLogService orderLogService,
    AsignService asignService
  ) {
    this.orderRepository = orderRepository;
    this.contractRepository = contractRepository;
    this.orderLogService = orderLogService;
    this.asignService = asignService;
  }

  @PostMapping("/{orderId}/start")
  public Contract start(HttpServletRequest request, @PathVariable String orderId) {
    var principal = AuthContext.require(request, PrincipalType.H5);
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (!order.getPhone().equals(principal.phoneOrUsername())) throw new ApiException(HttpStatus.FORBIDDEN, "无权限");

    var existing = contractRepository.findById(orderId).orElse(null);
    if (existing != null) {
      var status = existing.getStatus();
      if ("SIGNING".equals(status) || "SIGNED".equals(status)) return existing;
    }

    var contract = new Contract();
    contract.setId("c_" + UUID.randomUUID().toString().replace("-", ""));
    contract.setOrderId(orderId);
    contract.setContractType("ORDER");
    contract.setProvider("RESERVED");
    contract.setStatus("SIGNING");
    contract.setSignUrl("https://example.com/esign/sign?orderId=" + orderId);
    contract.setCreatedAt(Instant.now());
    contract.setUpdatedAt(Instant.now());
    contractRepository.save(contract);

    orderLogService.add(order, "CONTRACT_STARTED", "H5", l -> l.setActor(principal.phoneOrUsername()));
    orderRepository.save(order);
    return contract;
  }

  @GetMapping("/{orderId}")
  public Contract get(HttpServletRequest request, @PathVariable String orderId) {
    var principal = AuthContext.require(request, PrincipalType.H5);
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (!order.getPhone().equals(principal.phoneOrUsername())) throw new ApiException(HttpStatus.FORBIDDEN, "无权限");
    return contractRepository.findById(orderId).orElse(null);
  }

  @PostMapping("/{orderId}/sync")
  public Map<String, Object> sync(HttpServletRequest request, @PathVariable String orderId) {
    var principal = AuthContext.require(request, PrincipalType.H5);
    var order = orderRepository.findById(orderId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (!order.getPhone().equals(principal.phoneOrUsername())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "无权限");
    }

    var contract = contractRepository.findById(orderId).orElse(null);
    if (contract == null) {
      return Map.of("synced", false, "reason", "合同不存在");
    }
    if (!"SIGNING".equals(contract.getStatus())) {
      return Map.of("synced", false, "status", contract.getStatus(), "reason", "合同不在签署中状态");
    }
    if (contract.getContractNo() == null || contract.getContractNo().isBlank()) {
      return Map.of("synced", false, "reason", "合同编号为空");
    }

    try {
      String latestStatus = asignService.queryContractStatus(contract.getContractNo());
      log.info("合同状态同步查询: orderId={}, contractNo={}, latestStatus={}", orderId, contract.getContractNo(), latestStatus);

      if ("SIGNED".equals(latestStatus)) {
        asignService.applySignedContract(contract, null);
        try {
          String fileUrl = asignService.downloadContract(contract.getContractNo());
          if (fileUrl != null && !fileUrl.isBlank()) {
            contract.setFileUrl(fileUrl);
          }
        } catch (Exception ex) {
          log.warn("同步时下载合同文件失败: {}", ex.getMessage());
        }
        contractRepository.save(contract);
        orderLogService.add(order, "CONTRACT_SYNCED", "H5", l -> l.setContractStatus(latestStatus));
        orderRepository.save(order);
        return Map.of("synced", true, "status", latestStatus);
      }

      if ("USER_SIGNED".equals(latestStatus)) {
        return Map.of("synced", false, "status", latestStatus, "reason", "客户已签署，等待企业盖章完成");
      }

      if ("EXPIRED".equals(latestStatus) || "VOID".equals(latestStatus) || "FAILED".equals(latestStatus)) {
        if ("EXPIRED".equals(latestStatus) || "VOID".equals(latestStatus)) {
          asignService.applyVoidContract(contract, latestStatus);
        } else {
          asignService.applyFailedContract(contract, latestStatus);
        }
        contractRepository.save(contract);
        return Map.of("synced", true, "status", latestStatus);
      }

      return Map.of("synced", false, "status", latestStatus, "reason", "合同仍在签署中");
    } catch (Exception ex) {
      log.warn("合同状态同步失败: orderId={}, error={}", orderId, ex.getMessage());
      return Map.of("synced", false, "reason", "查询失败: " + ex.getMessage());
    }
  }
}
