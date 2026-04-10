package com.evlease.installment.controller.admin;

import com.evlease.installment.auth.AuthContext;
import com.evlease.installment.auth.PrincipalType;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.config.AppProperties;
import com.evlease.installment.asign.AsignConfig;
import com.evlease.installment.asign.AsignService;
import com.evlease.installment.juzheng.NotaryService;
import com.evlease.installment.model.Contract;
import com.evlease.installment.model.Order;
import com.evlease.installment.model.OrderStatus;
import com.evlease.installment.repo.ContractRepository;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.service.OrderLogService;
import com.evlease.installment.sms.SmsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/contracts")
public class AdminContractController {
  private final OrderRepository orderRepository;
  private final ContractRepository contractRepository;
  private final OrderLogService orderLogService;
  private final NotaryService notaryService;
  private final ObjectMapper objectMapper;
  private final AppProperties appProperties;
  private final AsignService asignService;
  private final AsignConfig asignConfig;
  private final SmsService smsService;

  public AdminContractController(
    OrderRepository orderRepository,
    ContractRepository contractRepository,
    OrderLogService orderLogService,
    NotaryService notaryService,
    ObjectMapper objectMapper,
    AppProperties appProperties,
    AsignService asignService,
    AsignConfig asignConfig,
    SmsService smsService
  ) {
    this.orderRepository = orderRepository;
    this.contractRepository = contractRepository;
    this.orderLogService = orderLogService;
    this.notaryService = notaryService;
    this.objectMapper = objectMapper;
    this.appProperties = appProperties;
    this.asignService = asignService;
    this.asignConfig = asignConfig;
    this.smsService = smsService;
  }

  @GetMapping("/template-components/{templateNo}")
  public Map<String, Object> getTemplateComponents(@PathVariable String templateNo) throws Exception {
    return asignService.getTemplateComponents(templateNo);
  }

  @GetMapping("/debug-config")
  public Map<String, Object> debugConfig() {
    Map<String, Object> config = new HashMap<>();
    config.put("baseUrl", asignConfig.getBaseUrl());
    config.put("templateNo", asignConfig.getTemplateNo());
    config.put("appId", mask(asignConfig.getAppId()));
    config.put("companyAccount", asignConfig.getCompanyAccount());
    config.put("companyName", asignConfig.getCompanyName());
    config.put("companySerialNo", mask(asignConfig.getCompanySerialNo()));
    config.put("companyAddress", asignConfig.getCompanyAddress());
    config.put("useStranger", asignConfig.isUseStranger());
    return config;
  }

  private String mask(String value) {
    if (value == null || value.length() < 8) return value;
    return value.substring(0, 4) + "****" + value.substring(value.length() - 4);
  }

  @GetMapping
  public List<Contract> list(@RequestParam(required = false) String type) {
    if (type == null || type.isBlank()) {
      return contractRepository.findAll();
    }
    return contractRepository.findAll().stream()
      .filter(c -> type.equalsIgnoreCase(c.getContractType()))
      .toList();
  }

  public record UploadResponse(String url) {}

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public UploadResponse upload(@RequestParam("file") MultipartFile file) throws IOException {
    if (file == null || file.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "请选择文件");

    var contentType = file.getContentType();
    var original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
    var ext = guessExt(original, contentType);
    if (ext.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "仅支持PDF文件");
    }

    var name = "contract_" + UUID.randomUUID().toString().replace("-", "") + ext;
    var uploadDir = appProperties.getUpload().getDir();
    if (uploadDir == null || uploadDir.isBlank()) uploadDir = "uploads";
    var dir = Path.of(uploadDir).toAbsolutePath().normalize();
    Files.createDirectories(dir);

    var target = dir.resolve(name).normalize();
    if (!target.startsWith(dir)) throw new ApiException(HttpStatus.BAD_REQUEST, "非法文件名");

    file.transferTo(target);
    return new UploadResponse("/uploads/" + name);
  }

  @GetMapping("/{orderId}")
  public Contract get(@PathVariable String orderId) {
    return contractRepository.findById(orderId).orElse(null);
  }

  public record PrepareRequest(String contractNo, String templateId, String productFrameNo) {}

  @PostMapping("/{orderId}/prepare")
  public Contract prepare(@PathVariable String orderId, @Valid @RequestBody PrepareRequest req) {
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (order.getStatus() != OrderStatus.ACTIVE) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "仅审核通过的订单可生成合同");
    }
    if (!order.isKycCompleted()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "客户未完成KYC，无法生成合同");
    }
    // 检查爱签实名认证状态
    if (order.getAsignSerialNo() == null || order.getAsignSerialNo().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "客户未完成爱签实名认证，请让客户在H5订单详情页点击'去实名认证'完成人脸认证");
    }
    if (!asignConfig.isUseStranger() && !"1".equals(order.getAsignAuthResult())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "客户爱签实名认证未通过，请客户重新完成人脸认证后再签合同");
    }

    var contract = contractRepository.findById(orderId).orElse(null);
    if (contract == null) {
      contract = new Contract();
      contract.setId("c_" + UUID.randomUUID().toString().replace("-", ""));
      contract.setOrderId(orderId);
      contract.setCreatedAt(Instant.now());
    }

    AsignService.PrepareResult prepareResult;
    try {
      prepareResult = asignService.prepareContract(order, req.contractNo(), req.templateId(), req.productFrameNo());
    } catch (Exception ex) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    contract.setContractType("ORDER");
    contract.setProvider("ASIGN");
    contract.setContractNo(prepareResult.contractNo());
    contract.setTemplateId(prepareResult.templateNo());
    contract.setStatus("SIGNING");
    contract.setSignUrl(prepareResult.signUrl());
    contract.setUpdatedAt(Instant.now());
    contract.setMeta(buildOrderMeta(order));
    contractRepository.save(contract);

    orderLogService.add(order, "CONTRACT_PREPARED", "ADMIN");
    orderRepository.save(order);
    
    // 发送签署链接短信给客户
    try {
      String smsContent = "【华兴租赁】您的租赁合同已生成，请点击链接签署：" + prepareResult.signUrl();
      smsService.send(order.getPhone(), smsContent, "CONTRACT", orderId);
    } catch (Exception e) {
      // 短信发送失败不影响合同生成
      System.out.println("发送签署链接短信失败: " + e.getMessage());
    }
    
    return contract;
  }

  /**
   * 主动向爱签查询合同状态并同步到本地 DB。
   * 解决测试环境回调无法触达时，管理员需手动标记的问题。
   */
  @PostMapping("/{orderId}/sync-status")
  public Contract syncStatus(@PathVariable String orderId) {
    var contract = contractRepository.findById(orderId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "合同不存在"));
    if (contract.getContractNo() == null || contract.getContractNo().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "合同编号为空，无法查询");
    }

    String newStatus;
    try {
      newStatus = asignService.queryContractStatus(contract.getContractNo());
    } catch (Exception ex) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "查询爱签状态失败：" + ex.getMessage());
    }

    String oldStatus = contract.getStatus();
    // USER_SIGNED: 客户已签但整体合同还未完结（企业骑缝章流程中）
    // 设置 customerSigned=true 让管理员看到后再手动确认
    if ("USER_SIGNED".equals(newStatus)) {
      contract.setCustomerSigned(true);
      contract.setUpdatedAt(java.time.Instant.now());
      contractRepository.save(contract);
      var order = orderRepository.findById(orderId).orElse(null);
      if (order != null) {
        orderLogService.add(order, "CONTRACT_SYNC_USER_SIGNED", "ADMIN");
        orderRepository.save(order);
      }
      return contract;
    }

    if (!newStatus.equals(oldStatus)) {
      if ("SIGNED".equals(newStatus)) {
        contract.setStatus("SIGNED");
        contract.setSignedAt(java.time.Instant.now());
        // 尝试自动下载合同文件
        try {
          String fileUrl = asignService.downloadContract(contract.getContractNo());
          if (fileUrl != null && !fileUrl.isBlank()) {
            contract.setFileUrl(fileUrl);
          }
        } catch (Exception ex) {
          // 下载失败不影响状态更新
        }
        // 同步后发起公证
        var order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
          orderLogService.add(order, "CONTRACT_SYNC_SIGNED", "ADMIN");
          orderRepository.save(order);
          try {
            if (order.getNotaryOrderNo() == null || order.getNotaryOrderNo().isBlank()) {
              applyNotaryInternal(order);
            }
          } catch (Exception ex) {
            // 公证失败不影响合同状态
          }
        }
      } else if ("VOID".equals(newStatus) || "FAILED".equals(newStatus) || "EXPIRED".equals(newStatus)) {
        contract.setStatus(newStatus);
        var order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
          orderLogService.add(order, "CONTRACT_SYNC_" + newStatus, "ADMIN");
          orderRepository.save(order);
        }
      }
      contract.setUpdatedAt(java.time.Instant.now());
      contractRepository.save(contract);
    }

    return contract;
  }

  private void applyNotaryInternal(Order order) throws Exception {
    if (!order.isKycCompleted()) return;
    String outOrderNo = notaryService.applyLeaseNotary(order);
    order.setNotaryOrderNo(outOrderNo);
    order.setNotaryStatus("10");
    orderLogService.add(order, "NOTARY_APPLY", "ADMIN", l -> l.setActor("合同同步后自动发起"));
    orderRepository.save(order);
  }

  @PostMapping("/{orderId}/download")
  public Contract downloadContractFile(@PathVariable String orderId) {
    var contract = contractRepository.findById(orderId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "合同不存在"));
    if (contract.getContractNo() == null || contract.getContractNo().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "合同编号为空，无法下载");
    }
    try {
      String fileUrl = asignService.downloadContract(contract.getContractNo());
      if (fileUrl == null || fileUrl.isBlank()) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "下载合同文件失败：返回为空");
      }
      contract.setFileUrl(fileUrl);
      contract.setUpdatedAt(java.time.Instant.now());
      contractRepository.save(contract);
      return contract;
    } catch (ApiException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "下载合同文件失败：" + ex.getMessage());
    }
  }

  public record MarkSignedRequest(String signedBy) {}

  @PostMapping("/{orderId}/mark-signed")
  public Contract markSigned(@PathVariable String orderId, @Valid @RequestBody MarkSignedRequest req) {
    var contract = contractRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "合同不存在"));
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));

    contract.setStatus("SIGNED");
    contract.setSignedAt(Instant.now());
    if (req.signedBy() != null && !req.signedBy().isBlank()) {
      contract.setSignedBy(req.signedBy().trim());
    }
    contract.setUpdatedAt(Instant.now());
    contractRepository.save(contract);

    orderLogService.add(order, "CONTRACT_SIGNED", "ADMIN", l -> l.setActor(contract.getSignedBy()));
    orderRepository.save(order);

    // 自动发起公证（失败不影响合同状态）
    try {
      applyNotary(order);
    } catch (Exception ex) {
      order.setNotaryStatus("FAILED");
      orderLogService.add(order, "NOTARY_AUTO_FAILED", "ADMIN", l -> l.setActor(ex.getMessage()));
      orderRepository.save(order);
    }

    return contract;
  }

  public record ManualContractRequest(
    String id,
    String contractNo,
    String orderNo,
    String productName,
    String renterName,
    String renterIdNumber,
    String renterPhone,
    String leaseStart,
    String leaseEnd,
    Integer periods,
    Integer cycleDays,
    Integer rentPerPeriod,
    Double depositRatio,
    String signedAt,
    String signedBy,
    String status,
    String fileUrl,
    String remark
  ) {}

  @PostMapping("/manual")
  public Contract upsertManual(@Valid @RequestBody ManualContractRequest req) {
    String recordId = req.id();
    Contract contract = null;
    if (recordId != null && !recordId.isBlank()) {
      contract = contractRepository.findById(recordId).orElse(null);
      if (contract != null && !"MANUAL".equalsIgnoreCase(contract.getContractType())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "该合同不是历史合同记录");
      }
    }

    if (contract == null) {
      contract = new Contract();
      contract.setOrderId("manual_" + UUID.randomUUID().toString().replace("-", ""));
      contract.setId("c_" + UUID.randomUUID().toString().replace("-", ""));
      contract.setCreatedAt(Instant.now());
    }

    contract.setContractType("MANUAL");
    contract.setProvider("MANUAL");
    contract.setContractNo(req.contractNo());
    contract.setStatus(req.status() == null || req.status().isBlank() ? "SIGNED" : req.status().trim());
    contract.setSignedBy(req.signedBy());
    contract.setFileUrl(req.fileUrl());
    contract.setUpdatedAt(Instant.now());
    contract.setSignedAt(parseInstant(req.signedAt()));
    contract.setMeta(buildManualMeta(req));

    contractRepository.save(contract);
    return contract;
  }

  private Instant parseInstant(String value) {
    if (value == null || value.isBlank()) return null;
    try {
      return Instant.parse(value.trim());
    } catch (Exception ex) {
      return null;
    }
  }

  private String buildOrderMeta(Order order) {
    Map<String, Object> meta = new HashMap<>();
    meta.put("orderId", order.getId());
    meta.put("productName", order.getProductName());
    meta.put("periods", order.getPeriods());
    meta.put("cycleDays", order.getCycleDays());
    meta.put("depositRatio", order.getDepositRatio());
    meta.put("rentPerPeriod", order.getRepaymentPlan() == null ? 0 :
      order.getRepaymentPlan().stream().mapToInt(p -> p.getAmount()).max().orElse(0));
    meta.put("renterName", order.getRealName());
    meta.put("renterIdNumber", order.getIdCardNumber());
    meta.put("renterPhone", order.getPhone());
    // 租赁开始时间取下单时间（createdAt），而非第一期付款日
    String leaseStart = "";
    if (order.getCreatedAt() != null) {
      leaseStart = order.getCreatedAt()
          .atZone(java.time.ZoneId.of("Asia/Shanghai"))
          .toLocalDate()
          .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
    }
    meta.put("leaseStart", leaseStart);
    meta.put("leaseEnd", order.getRepaymentPlan() == null || order.getRepaymentPlan().isEmpty()
      ? "" : order.getRepaymentPlan().get(order.getRepaymentPlan().size() - 1).getDueDate());
    try {
      return objectMapper.writeValueAsString(meta);
    } catch (Exception ex) {
      return "{}";
    }
  }

  private String buildManualMeta(ManualContractRequest req) {
    Map<String, Object> meta = new HashMap<>();
    meta.put("orderNo", req.orderNo());
    meta.put("productName", req.productName());
    meta.put("renterName", req.renterName());
    meta.put("renterIdNumber", req.renterIdNumber());
    meta.put("renterPhone", req.renterPhone());
    meta.put("leaseStart", req.leaseStart());
    meta.put("leaseEnd", req.leaseEnd());
    meta.put("periods", req.periods());
    meta.put("cycleDays", req.cycleDays());
    meta.put("rentPerPeriod", req.rentPerPeriod());
    meta.put("depositRatio", req.depositRatio());
    meta.put("signedAt", req.signedAt());
    meta.put("remark", req.remark());
    try {
      return objectMapper.writeValueAsString(meta);
    } catch (Exception ex) {
      return "{}";
    }
  }

  private void applyNotary(Order order) throws Exception {
    if (order.getNotaryOrderNo() != null && !order.getNotaryOrderNo().isBlank()) {
      return;
    }
    if (!order.isKycCompleted()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "客户未完成KYC，无法发起公证");
    }
    String outOrderNo = notaryService.applyLeaseNotary(order);
    order.setNotaryOrderNo(outOrderNo);
    order.setNotaryStatus("10");
    orderLogService.add(order, "NOTARY_APPLY", "ADMIN", l -> l.setActor("自动发起"));
    orderRepository.save(order);
  }

  @DeleteMapping("/{orderId}")
  public Map<String, String> delete(@PathVariable String orderId, HttpServletRequest request) {
    var principal = AuthContext.require(request, PrincipalType.ADMIN);
    if (!"SUPER".equals(principal.role())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "仅总账号可执行删除操作");
    }
    var contract = contractRepository.findById(orderId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "合同不存在"));
    contractRepository.delete(contract);
    return Map.of("message", "删除成功");
  }

  private String guessExt(String filename, String contentType) {
    var lower = filename.toLowerCase(Locale.ROOT);
    if (lower.endsWith(".pdf")) return ".pdf";
    if (contentType == null) return "";
    var ct = contentType.toLowerCase(Locale.ROOT);
    if (ct.contains("pdf")) return ".pdf";
    return "";
  }
}
