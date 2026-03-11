package com.evlease.installment.asign;

import com.evlease.installment.common.ApiException;
import com.evlease.installment.config.AppProperties;
import com.evlease.installment.model.Contract;
import com.evlease.installment.model.Order;
import com.evlease.installment.model.Region;
import com.evlease.installment.repo.ProductCategoryRepository;
import com.evlease.installment.repo.ProductRepository;
import com.evlease.installment.repo.RegionRepository;
import com.evlease.installment.util.RegionNameUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AsignService {
  private static final List<String> USER_EXISTS_CODES = List.of("100021");
  private final AsignClient client;
  private final AsignConfig config;
  private final AppProperties appProperties;
  private final ObjectMapper objectMapper;
  private final RegionRepository regionRepository;
  private final ProductRepository productRepository;
  private final ProductCategoryRepository categoryRepository;
  
  // 临时存储当前合同的车架号（由调用方传入）
  private String currentProductFrameNo;

  public AsignService(AsignClient client, AsignConfig config, AppProperties appProperties,
                      RegionRepository regionRepository, ProductRepository productRepository,
                      ProductCategoryRepository categoryRepository) {
    this.client = client;
    this.config = config;
    this.appProperties = appProperties;
    this.objectMapper = new ObjectMapper();
    this.regionRepository = regionRepository;
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
  }

  public record PrepareResult(
    String contractNo,
    String templateNo,
    String signUrl,
    String previewUrl,
    String companyAccount,
    String userAccount
  ) {}

  public record AuthUrlResult(String serialNo, String authUrl) {}

  public PrepareResult prepareContract(Order order, String contractNoOverride, String templateNoOverride, String productFrameNo) throws Exception {
    ensureConfigured();
    String contractNo = resolveContractNo(order, contractNoOverride);
    String templateNo = resolveTemplateNo(templateNoOverride);
    // 保存车架号供 buildTemplateFill 使用
    this.currentProductFrameNo = productFrameNo;
    
    // 获取并打印模板控件信息，用于调试
    try {
      getTemplateComponents(templateNo);
    } catch (Exception e) {
      System.out.println("Failed to get template components: " + e.getMessage());
    }
    
    String companyAccount = ensureCompanyUser();
    String userAccount = ensurePersonalUser(order);

    Map<String, Object> createParams = new HashMap<>();
    createParams.put("contractNo", contractNo);
    createParams.put("contractName", buildContractName(order));
    createParams.put("signOrder", config.getSignOrder());
    // 设置合同有效期为当前日期 + 90天，格式：yyyy-MM-dd HH:mm:ss
    java.time.LocalDateTime validityDateTime = java.time.LocalDateTime.now().plusDays(90);
    java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    createParams.put("validityDate", validityDateTime.format(formatter));

    Map<String, Object> template = new HashMap<>();
    template.put("templateNo", templateNo);
    // 使用配置的模板填充数据
    Map<String, Object> fillData = buildTemplateFill(order);
    if (!fillData.isEmpty()) template.put("fillData", fillData);
    createParams.put("templates", List.of(template));

    String notifyUrl = resolveNotifyUrl();
    if (!notifyUrl.isBlank()) createParams.put("notifyUrl", notifyUrl);
    String callbackUrl = resolveCallbackUrl();
    if (!callbackUrl.isBlank()) createParams.put("callbackUrl", callbackUrl);
    String userNotifyUrl = resolveUserNotifyUrl();
    if (!userNotifyUrl.isBlank()) createParams.put("userNotifyUrl", userNotifyUrl);
    if (config.getRedirectUrl() != null && !config.getRedirectUrl().isBlank()) {
      createParams.put("redirectUrl", config.getRedirectUrl());
    }

    Map<String, Object> createResult = client.post("/contract/createContract", createParams);
    String previewUrl = extractPreviewUrl(createResult);

    // 企业签署 signType=2（自动签署），用户签署使用配置值
    List<Map<String, Object>> signers = List.of(
      buildSigner(companyAccount, contractNo, 2, config.getCompanySignKey(), 1, true),
      buildSigner(userAccount, contractNo, config.getUserSignType(), config.getUserSignKey(), 2, false)
    );
    Map<String, Object> signResult = client.postList("/contract/addSigner", signers);
    String signUrl = extractSignUrl(signResult, userAccount);

    return new PrepareResult(contractNo, templateNo, signUrl, previewUrl, companyAccount, userAccount);
  }

  public AuthUrlResult requestPersonIdentifyUrl(Order order) throws Exception {
    ensureConfigured();
    if (order.getRealName() == null || order.getRealName().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "renter name missing");
    }
    if (order.getIdCardNumber() == null || order.getIdCardNumber().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "renter idCard missing");
    }
    String idCardNo = normalizeIdCardNo(order.getIdCardNumber());
    Map<String, Object> payload = new HashMap<>();
    payload.put("realName", order.getRealName());
    payload.put("idCardNo", idCardNo);
    payload.put("bizId", order.getId());
    String notifyUrl = resolveAuthNotifyUrl();
    if (!notifyUrl.isBlank()) payload.put("notifyUrl", notifyUrl);
    String redirectUrl = resolveAuthRedirectUrl();
    if (!redirectUrl.isBlank()) payload.put("redirectUrl", redirectUrl);
    Map<String, Object> result = client.post("/auth/person/identifyUrl", payload);
    Map<String, Object> data = extractData(result);
    String serialNo = data == null ? "" : String.valueOf(data.getOrDefault("serialNo", ""));
    String authUrl = extractAuthUrl(data);
    return new AuthUrlResult(serialNo, authUrl);
  }

  /**
   * 主动查询爱签合同状态
   * 返回 status: "SIGNING" | "SIGNED" | "VOID" | "FAILED" | "EXPIRED"
   * 爱签 status 字段含义：1-草稿 2-签署完成 3-已过期 4-拒签 -3-失败
   */
  public String queryContractStatus(String contractNo) throws Exception {
    ensureConfigured();
    Map<String, Object> result = client.post("/contract/queryContract", Map.of("contractNo", contractNo));
    Map<String, Object> data = extractData(result);
    if (data == null) return "SIGNING";
    Object statusObj = data.get("status");
    if (statusObj == null) return "SIGNING";
    String raw = String.valueOf(statusObj).trim();
    return switch (raw) {
      case "2" -> "SIGNED";
      case "3" -> "EXPIRED";
      case "4" -> "VOID";
      case "-3" -> "FAILED";
      default -> "SIGNING";
    };
  }

  public String downloadContract(String contractNo) throws Exception {
    Map<String, Object> result = client.post("/contract/downloadContract", Map.of(
      "contractNo", contractNo,
      "downloadFileType", 1,
      "force", 1
    ));
    Map<String, Object> data = extractData(result);
    if (data == null) return "";
    String base64 = String.valueOf(data.getOrDefault("data", "")).trim();
    if (base64.isBlank()) return "";
    byte[] bytes = Base64.getDecoder().decode(base64);
    String filename = "contract_" + sanitize(contractNo) + ".pdf";
    Path dir = resolveUploadDir();
    Files.createDirectories(dir);
    Path target = dir.resolve(filename).normalize();
    if (!target.startsWith(dir)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "invalid file path");
    }
    Files.write(target, bytes);
    return "/uploads/" + filename;
  }

  public void applySignedContract(Contract contract, String signTime) {
    contract.setStatus("SIGNED");
    contract.setSignedAt(parseInstant(signTime));
    contract.setUpdatedAt(Instant.now());
  }

  public void applyVoidContract(Contract contract, String reason) {
    contract.setStatus("VOID");
    contract.setVoidReason(reason);
    contract.setUpdatedAt(Instant.now());
  }

  public void applyFailedContract(Contract contract, String reason) {
    contract.setStatus("FAILED");
    contract.setVoidReason(reason);
    contract.setUpdatedAt(Instant.now());
  }

  public boolean verifyCallback(Map<String, Object> payload, String sign) throws Exception {
    if (config.getPublicKey() == null || config.getPublicKey().isBlank()) return true;
    return AsignCryptoUtil.verify(payload, sign, config.getPublicKey());
  }

  /**
   * 获取模板控件信息
   * 返回模板中所有控件的名称和类型
   */
  public Map<String, Object> getTemplateComponents(String templateNo) throws Exception {
    ensureConfigured();
    if (templateNo == null || templateNo.isBlank()) {
      templateNo = config.getTemplateNo();
    }
    Map<String, Object> params = new HashMap<>();
    params.put("templateIdent", templateNo);
    Map<String, Object> result = client.post("/template/data", params);
    System.out.println("=== Template controls for " + templateNo + " ===");
    System.out.println(result);
    return result;
  }

  public boolean verifyAuthCallback(String name, String idNo, String serialNo, String result, String sign) throws Exception {
    if (config.getPublicKey() == null || config.getPublicKey().isBlank()) return true;
    return AsignCryptoUtil.verifyAuthCallback(name, idNo, serialNo, result, sign, config.getPublicKey());
  }

  private void ensureConfigured() {
    if (config.getAppId() == null || config.getAppId().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "asign appId missing");
    }
    if (config.getPrivateKey() == null || config.getPrivateKey().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "asign privateKey missing");
    }
    if (resolveTemplateNo("") == null || resolveTemplateNo("").isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "asign templateNo missing");
    }
  }

  private String resolveContractNo(Order order, String override) {
    if (override != null && !override.isBlank()) return override.trim();
    // 生成唯一的合同编号，限制40字符以内
    // 格式：C + 订单ID后8位 + 时间戳后8位 = 17字符
    String orderId = order.getId();
    String orderSuffix = orderId.length() > 8 ? orderId.substring(orderId.length() - 8) : orderId;
    String timestamp = String.valueOf(System.currentTimeMillis() % 100000000);
    return "C" + orderSuffix + timestamp;
  }

  private String resolveTemplateNo(String override) {
    if (override != null && !override.isBlank()) return override.trim();
    return config.getTemplateNo() == null ? "" : config.getTemplateNo().trim();
  }

  private String buildContractName(Order order) {
    String name = order.getProductName();
    if (name == null || name.isBlank()) return "租赁合同";
    return name + " 租赁合同";
  }

  private String resolveNotifyUrl() {
    if (config.getNotifyUrl() != null && !config.getNotifyUrl().isBlank()) return config.getNotifyUrl();
    String base = appProperties.getPublicBaseUrl();
    if (base == null || base.isBlank()) return "";
    return base + "/api/callbacks/asign/contract";
  }

  private String resolveAuthNotifyUrl() {
    if (config.getAuthNotifyUrl() != null && !config.getAuthNotifyUrl().isBlank()) return config.getAuthNotifyUrl();
    String base = appProperties.getPublicBaseUrl();
    if (base == null || base.isBlank()) return "";
    return base + "/api/callbacks/asign/auth";
  }

  private String resolveAuthRedirectUrl() {
    if (config.getAuthRedirectUrl() != null && !config.getAuthRedirectUrl().isBlank()) return config.getAuthRedirectUrl();
    return "";
  }

  private String resolveCallbackUrl() {
    if (config.getCallbackUrl() != null && !config.getCallbackUrl().isBlank()) return config.getCallbackUrl();
    String base = appProperties.getPublicBaseUrl();
    if (base == null || base.isBlank()) return "";
    return base + "/api/callbacks/asign/contract";
  }

  private String resolveUserNotifyUrl() {
    if (config.getUserNotifyUrl() != null && !config.getUserNotifyUrl().isBlank()) return config.getUserNotifyUrl();
    return "";
  }

  private String ensureCompanyUser() throws Exception {
    String account = config.getCompanyAccount();
    if (account == null || account.isBlank()) {
      account = config.getCompanyCertNo();
    }
    if (account == null || account.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "asign company account missing");
    }
    Map<String, Object> payload = new HashMap<>();
    payload.put("account", account);
    payload.put("companyName", config.getCompanyName());
    payload.put("creditCode", config.getCompanyCertNo());
    payload.put("name", config.getLegalName());
    payload.put("idCard", config.getLegalCertNo());
    payload.put("mobile", resolveCompanyMobile());
    payload.put("contactName", resolveCompanyContactName());
    payload.put("contactIdCard", resolveCompanyContactIdCard());
    if (config.getCompanySerialNo() != null && !config.getCompanySerialNo().isBlank()) {
      payload.put("serialNo", config.getCompanySerialNo());
    }
    client.postAllowCodes("/v2/user/addEnterpriseUser", payload, USER_EXISTS_CODES);
    return account;
  }

  private String ensurePersonalUser(Order order) throws Exception {
    if (order.getRealName() == null || order.getRealName().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "renter name missing");
    }
    if (order.getIdCardNumber() == null || order.getIdCardNumber().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "renter idCard missing");
    }
    if (order.getPhone() == null || order.getPhone().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "renter phone missing");
    }
    String idCardNo = normalizeIdCardNo(order.getIdCardNumber());
    String account = resolveUserAccount(order);
    // 仅在配置启用时才走陌生人模式
    if (config.isUseStranger()) {
      Map<String, Object> payload = new HashMap<>();
      payload.put("account", account);
      payload.put("userType", 2);
      payload.put("name", order.getRealName());
      payload.put("mobile", order.getPhone());
      client.postAllowCodes("/v2/user/addStranger", payload, USER_EXISTS_CODES);
      return account;
    }
    String serialNo = order.getAsignSerialNo();
    String authResult = order.getAsignAuthResult();
    if (serialNo == null || serialNo.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "请先完成爱签实名认证（客户需在H5订单详情页点击'去实名认证'）");
    }
    // 检查认证结果，"1" 表示认证成功
    if (authResult == null || !authResult.equals("1")) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "爱签实名认证未完成或失败，请客户重新进行人脸认证");
    }
    Map<String, Object> payload = new HashMap<>();
    payload.put("account", account);
    payload.put("serialNo", serialNo);
    payload.put("idCard", idCardNo);
    payload.put("idCardType", 1);
    payload.put("mobile", order.getPhone());
    // 签约密码：使用手机号后6位
    String signPwd = order.getPhone().length() >= 6 
        ? order.getPhone().substring(order.getPhone().length() - 6) 
        : "123456";
    payload.put("signPwd", signPwd);
    payload.put("isSignPwdNotice", 1); // 短信通知用户签约密码
    payload.put("isNotice", 1); // 签署时发送短信
    client.postAllowCodes("/v2/user/addPersonalUser", payload, USER_EXISTS_CODES);
    return account;
  }

  private String resolveUserAccount(Order order) {
    if (order.getIdCardNumber() != null && !order.getIdCardNumber().isBlank()) {
      return normalizeIdCardNo(order.getIdCardNumber());
    }
    return order.getPhone();
  }

  private String normalizeIdCardNo(String idCardNo) {
    if (idCardNo == null) return "";
    var normalized = idCardNo.trim().replace(" ", "");
    if (normalized.endsWith("x")) {
      normalized = normalized.substring(0, normalized.length() - 1) + "X";
    }
    return normalized;
  }

  private String resolveCompanyMobile() {
    if (config.getCompanyMobile() != null && !config.getCompanyMobile().isBlank()) {
      return config.getCompanyMobile();
    }
    if (config.getLegalPhone() != null && !config.getLegalPhone().isBlank()) {
      return config.getLegalPhone();
    }
    return "";
  }

  private String resolveCompanyContactName() {
    if (config.getCompanyContactName() != null && !config.getCompanyContactName().isBlank()) {
      return config.getCompanyContactName();
    }
    return config.getLegalName();
  }

  private String resolveCompanyContactIdCard() {
    if (config.getCompanyContactIdCard() != null && !config.getCompanyContactIdCard().isBlank()) {
      return config.getCompanyContactIdCard();
    }
    return config.getLegalCertNo();
  }

  private Map<String, Object> buildSigner(
    String account,
    String contractNo,
    int signType,
    String signKey,
    int signOrder,
    boolean companySigner
  ) throws Exception {
    Map<String, Object> signer = new HashMap<>();
    signer.put("account", account);
    signer.put("contractNo", contractNo);
    signer.put("signType", signType);
    // 始终传递签署顺序，确保企业先签、用户后签
    signer.put("signOrder", String.valueOf(signOrder));
    List<Map<String, Object>> strategy = parseStrategy(
      companySigner ? config.getCompanySignStrategyJson() : config.getUserSignStrategyJson(),
      signKey
    );
    if (!strategy.isEmpty()) signer.put("signStrategyList", strategy);
    System.out.println("构建签署人: account=" + account + ", signType=" + signType 
      + ", signOrder=" + signOrder + ", signKey=" + signKey 
      + ", strategySize=" + strategy.size() + ", isCompany=" + companySigner);
    return signer;
  }

  private List<Map<String, Object>> parseStrategy(String json, String signKey) throws Exception {
    if (json != null && !json.isBlank()) {
      return objectMapper.readValue(json, new TypeReference<>() {});
    }
    if (signKey == null || signKey.isBlank()) return List.of();
    Map<String, Object> strategy = new HashMap<>();
    strategy.put("attachNo", config.getSignAttachNo());
    strategy.put("locationMode", config.getSignLocationMode());
    strategy.put("signKey", signKey);
    return List.of(strategy);
  }

  /**
   * 构建简化的 fillData，只包含基本的字符串类型参数，
   * 移除可能导致爱签API报"参数异常"错误的数组类型参数
   */
  private Map<String, Object> buildSimpleFillData(Order order) {
    Map<String, Object> filled = new HashMap<>();
    
    // 手机号
    filled.put("iphone", safe(order.getPhone()));
    // 押金总额
    filled.put("yajin", "0");
    
    // 甲方信息
    filled.put("partyAName", safe(config.getCompanyName()));
    filled.put("partyAAddress", safe(config.getCompanyAddress()));
    
    // 乙方信息
    filled.put("partyBName", safe(order.getRealName()));
    filled.put("partyBIdNo", safe(order.getIdCardNumber()));
    filled.put("partyBPhone", safe(order.getPhone()));
    filled.put("partyBEmail", safe(order.getEmail()));
    filled.put("partyBAddress", safe(extractHomeAddress(order)));
    
    // 产品信息 - 规格显示车型（品牌+型号）
    filled.put("productName", safe(order.getProductName()));
    filled.put("productSpec", resolveProductSpec(order));
    filled.put("productQty", "1");
    // productFrameNo（车架号）留空，由用户手动输入
    
    // 租赁日期
    filled.put("leaseStartDate", safe(extractLeaseStart(order)));
    filled.put("leaseEndDate", safe(extractLeaseEnd(order)));
    int cycleDays = order.getCycleDays();
    int periods = order.getPeriods();
    filled.put("leaseDays", String.valueOf(cycleDays > 0 && periods > 0 ? cycleDays * periods : 360));
    
    // 租金信息
    int rentPerPeriod = extractMaxRent(order);
    BigDecimal rentPerPeriodAmount = BigDecimal.valueOf(rentPerPeriod);
    BigDecimal rentTotalAmount = rentPerPeriodAmount.multiply(BigDecimal.valueOf(periods));
    // 日租金 = 每期租金 / 30
    BigDecimal rentDaily = rentPerPeriodAmount.divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
    
    // 押金为0
    BigDecimal depositPerPeriod = BigDecimal.ZERO;
    BigDecimal depositTotal = BigDecimal.ZERO;
    
    filled.put("productAmount", formatAmount(rentTotalAmount.add(depositTotal)));  // 金额 = 租金 + 押金
    filled.put("rentTotalAmount", formatAmount(rentTotalAmount));
    filled.put("rentTotal", formatAmount(rentTotalAmount));
    filled.put("rentPeriodDays", String.valueOf(cycleDays));
    filled.put("rentDaily", formatAmount(rentDaily));
    
    filled.put("depositTotal", formatAmount(depositTotal));
    // depositPayType 已在模板中设为固定值，不需要传递
    filled.put("depositPeriods", String.valueOf(periods));
    filled.put("depositPeriodDays", String.valueOf(cycleDays));
    filled.put("depositPerPeriod", formatAmount(depositPerPeriod));  // 押金为0
    
    // 首期支付信息
    BigDecimal firstPayRent = BigDecimal.valueOf(extractFirstRent(order));
    BigDecimal firstPayDeposit = depositPerPeriod;  // 押金为0
    BigDecimal firstPayTotal = firstPayRent.add(firstPayDeposit);  // 首期总额 = 租金 + 押金
    filled.put("firstPayRent", formatAmount(firstPayRent));
    filled.put("firstPayDeposit", formatAmount(firstPayDeposit));
    filled.put("firstPayTotal", formatAmount(firstPayTotal));
    filled.put("firstPayDate", safe(extractLeaseStart(order)));
    
    // 交付信息
    filled.put("deliveryReceiveDate", safe(extractLeaseStart(order)));
    filled.put("deliveryContractDate", safe(extractLeaseStart(order)));
    filled.put("deliveryCustomerName", safe(order.getRealName()));
    filled.put("deliveryCustomerIdNo", safe(order.getIdCardNumber()));
    
    // 使用目的
    filled.put("usePurpose", "租赁使用");
    
    // 注意：不包含 deliveryItems 和 rentSchedule 数组类型参数
    return filled;
  }

  private Map<String, Object> buildTemplateFill(Order order) throws Exception {
    if (config.getTemplateFillJson() == null || config.getTemplateFillJson().isBlank()) return Map.of();
    Map<String, Object> raw = objectMapper.readValue(config.getTemplateFillJson(), new TypeReference<>() {});
    Map<String, String> vars = buildTemplateVars(order);
    Map<String, Object> filled = new HashMap<>();
    for (Map.Entry<String, Object> entry : raw.entrySet()) {
      Object value = entry.getValue();
      if (value instanceof String s) {
        String replaced = replaceVars(s, vars);
        // 跳过空值字段，避免爱签API报参数异常
        if (!replaced.isBlank()) {
          filled.put(entry.getKey(), replaced);
        }
      } else {
        filled.put(entry.getKey(), value);
      }
    }
    // 添加缺失的独立字段（模板中存在但 TEMPLATE_FILL_JSON 中可能未配置的）
    filled.putIfAbsent("iphone", vars.getOrDefault("iphone", ""));
    filled.putIfAbsent("yajin", vars.getOrDefault("yajin", "0"));
    filled.putIfAbsent("firstPayDate", vars.getOrDefault("firstPayDate", ""));
    filled.putIfAbsent("firstPayTotal", vars.getOrDefault("firstPayTotal", ""));
    filled.putIfAbsent("deliveryCustomerName", vars.getOrDefault("partyBName", ""));
    // 邮箱：无论是否填写都发送，避免模板配置了必填时报"缺少参数"
    // 若邮箱为空且模板将其设为必填，请在爱签模板编辑器中将 partyBEmail 的"必填"取消
    filled.put("partyBEmail", vars.getOrDefault("partyBEmail", ""));
    
    // 收货清单动态表格 — 模板控件 dataKey="表格1"，列：itemName, itemModel, itemQty
    List<Map<String, String>> table1 = new ArrayList<>();
    Map<String, String> deliveryItem = new HashMap<>();
    deliveryItem.put("itemName", vars.getOrDefault("productName", ""));
    deliveryItem.put("itemModel", vars.getOrDefault("productSpec", ""));
    deliveryItem.put("itemQty", vars.getOrDefault("productQty", "1"));
    table1.add(deliveryItem);
    filled.put("表格1", table1);
    
    // 租金明细动态表格 — 模板控件 dataKey="表格2"，列：periodNo, payDate, rentAmount, depositAmount, totalAmount
    List<Map<String, String>> table2 = new ArrayList<>();
    int periods = order.getPeriods();
    int cycleDays = order.getCycleDays();
    int rentPerPeriod = extractMaxRent(order);
    BigDecimal rentPerPeriodAmount = BigDecimal.valueOf(rentPerPeriod);
    
    // 押金为0
    BigDecimal depositPerPeriod = BigDecimal.ZERO;
    
    // 从还款计划获取起始日期
    String leaseStartStr = extractLeaseStart(order);
    java.time.LocalDate startDate = leaseStartStr.isBlank() 
      ? java.time.LocalDate.now() 
      : java.time.LocalDate.parse(leaseStartStr);
    
    for (int i = 1; i <= periods; i++) {
      Map<String, String> schedule = new HashMap<>();
      schedule.put("periodNo", String.valueOf(i));
      java.time.LocalDate payDate = startDate.plusDays((long)(i - 1) * cycleDays);
      schedule.put("payDate", payDate.toString());
      schedule.put("rentAmount", formatAmount(rentPerPeriodAmount));
      schedule.put("depositAmount", formatAmount(depositPerPeriod));
      schedule.put("totalAmount", formatAmount(rentPerPeriodAmount.add(depositPerPeriod)));
      table2.add(schedule);
    }
    filled.put("表格2", table2);
    
    return filled;
  }

  private Map<String, String> buildTemplateVars(Order order) {
    int rentPerPeriod = extractMaxRent(order);
    int periods = order.getPeriods();
    int cycleDays = order.getCycleDays();
    BigDecimal rentPerPeriodAmount = BigDecimal.valueOf(rentPerPeriod);
    BigDecimal rentTotalAmount = rentPerPeriodAmount.multiply(BigDecimal.valueOf(periods));
    
    // 押金为0
    BigDecimal depositPerPeriod = BigDecimal.ZERO;
    BigDecimal depositTotal = BigDecimal.ZERO;
    
    // 日租金 = 每期租金 / 30（每30天为一期）
    BigDecimal rentDaily = rentPerPeriodAmount.divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
    BigDecimal firstPayRent = BigDecimal.valueOf(extractFirstRent(order));
    BigDecimal firstPayDeposit = depositPerPeriod;  // 押金为0
    BigDecimal firstPayTotal = firstPayRent.add(firstPayDeposit);  // 首期总额 = 租金 + 押金

    Map<String, String> vars = new HashMap<>();
    vars.put("orderId", safe(order.getId()));
    vars.put("iphone", safe(order.getPhone()));
    vars.put("yajin", "0");
    vars.put("productName", safe(order.getProductName()));
    vars.put("productSpec", resolveProductSpec(order));
    vars.put("productQty", "1");
    // productFrameNo（车架号）由调用方传入
    vars.put("productFrameNo", safe(currentProductFrameNo));
    vars.put("productAmount", formatAmount(rentTotalAmount.add(depositTotal)));  // 金额 = 租金总额 + 押金总额
    vars.put("periods", String.valueOf(order.getPeriods()));
    vars.put("cycleDays", String.valueOf(order.getCycleDays()));
    vars.put("depositRatio", String.valueOf(order.getDepositRatio()));
    vars.put("renterName", safe(order.getRealName()));
    vars.put("renterIdNumber", safe(order.getIdCardNumber()));
    vars.put("renterPhone", safe(order.getPhone()));
    vars.put("partyBEmail", safe(order.getEmail()));
    // 乙方信息（用于收货清单等动态表格）
    vars.put("partyBName", safe(order.getRealName()));
    vars.put("partyBIdNo", safe(order.getIdCardNumber()));
    vars.put("companyName", safe(config.getCompanyName()));
    vars.put("companyCertNo", safe(config.getCompanyCertNo()));
    vars.put("legalName", safe(config.getLegalName()));
    vars.put("legalCertNo", safe(config.getLegalCertNo()));
    vars.put("legalPhone", safe(config.getLegalPhone()));
    // 租赁时间：leaseStart = 签约日期（今天），leaseEnd 从还款计划取
    vars.put("leaseStart", java.time.LocalDate.now().toString());
    vars.put("leaseEnd", safe(extractLeaseEnd(order)));
    vars.put("leaseDays", String.valueOf(cycleDays > 0 && periods > 0 ? cycleDays * periods : 0));
    vars.put("rentPerPeriod", formatAmount(rentPerPeriodAmount));
    vars.put("rentDaily", formatAmount(rentDaily));
    vars.put("rentPeriodDays", String.valueOf(cycleDays));
    vars.put("rentTotalAmount", formatAmount(rentTotalAmount));
    vars.put("depositTotal", formatAmount(depositTotal));
    // depositPayType 已在模板中设为固定值，不需要传递
    vars.put("depositPeriods", String.valueOf(periods));
    vars.put("depositPeriodDays", String.valueOf(cycleDays));
    vars.put("depositPerPeriod", formatAmount(depositPerPeriod));  // 押金为0
    // 签约日期 = 今天
    String signDate = java.time.LocalDate.now().toString();
    // 第一期支付日 = 签约日期 + 1个月
    String firstPayDateStr = java.time.LocalDate.now().plusMonths(1).toString();
    vars.put("firstPayDate", firstPayDateStr);
    vars.put("firstPayRent", formatAmount(firstPayRent));
    vars.put("firstPayDeposit", formatAmount(firstPayDeposit));  // 押金为0
    vars.put("firstPayTotal", formatAmount(firstPayTotal));  // 首期总额 = 租金 + 押金
    vars.put("deliveryReceiveDate", signDate);
    vars.put("deliveryContractDate", signDate);
    vars.put("userSignDate", signDate);
    vars.put("homeAddress", safe(extractHomeAddress(order)));
    vars.put("workCity", safe(order.getWorkCity()));
    vars.put("occupation", safe(order.getOccupation()));
    vars.put("employmentStatus", safe(order.getEmploymentStatus()));
    vars.put("incomeRangeCode", safe(order.getIncomeRangeCode()));
    return vars;
  }

  private String replaceVars(String input, Map<String, String> vars) {
    String result = input;
    for (Map.Entry<String, String> entry : vars.entrySet()) {
      result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
    }
    return result;
  }

  private String extractPreviewUrl(Map<String, Object> result) {
    Map<String, Object> data = extractData(result);
    if (data == null) return "";
    Object preview = data.get("previewUrl");
    return preview == null ? "" : String.valueOf(preview);
  }

  private String extractSignUrl(Map<String, Object> result, String account) {
    Map<String, Object> data = extractData(result);
    if (data == null) return "";
    Object signUserObj = data.get("signUser");
    if (signUserObj instanceof List<?> list) {
      for (Object item : list) {
        if (!(item instanceof Map<?, ?> map)) continue;
        Object itemAccount = map.get("account");
        if (itemAccount != null && account.equals(String.valueOf(itemAccount))) {
          Object url = map.get("signUrl");
          if (url != null) return String.valueOf(url);
        }
      }
    }
    return "";
  }

  private String extractAuthUrl(Map<String, Object> data) {
    if (data == null) return "";
    Object url = data.get("url");
    if (url != null) return String.valueOf(url);
    Object authUrl = data.get("authUrl");
    if (authUrl != null) return String.valueOf(authUrl);
    Object identifyUrl = data.get("identifyUrl");
    if (identifyUrl != null) return String.valueOf(identifyUrl);
    Object h5Url = data.get("h5Url");
    if (h5Url != null) return String.valueOf(h5Url);
    return "";
  }

  private Map<String, Object> extractData(Map<String, Object> result) {
    if (result == null) return null;
    Object data = result.get("data");
    if (data instanceof Map<?, ?> map) {
      Map<String, Object> casted = new HashMap<>();
      for (Map.Entry<?, ?> entry : map.entrySet()) {
        if (entry.getKey() != null) {
          casted.put(String.valueOf(entry.getKey()), entry.getValue());
        }
      }
      return casted;
    }
    return null;
  }

  private int extractMaxRent(Order order) {
    if (order.getRepaymentPlan() == null || order.getRepaymentPlan().isEmpty()) return 0;
    return order.getRepaymentPlan().stream().mapToInt(p -> p.getAmount()).max().orElse(0);
  }

  private int extractFirstRent(Order order) {
    if (order.getRepaymentPlan() == null || order.getRepaymentPlan().isEmpty()) return 0;
    return order.getRepaymentPlan().get(0).getAmount();
  }

  private List<Map<String, Object>> buildRentSchedule(Order order) {
    List<Map<String, Object>> rows = new ArrayList<>();
    if (order.getRepaymentPlan() == null || order.getRepaymentPlan().isEmpty()) return rows;
    
    // 押金为0
    BigDecimal depositPerPeriod = BigDecimal.ZERO;
    
    for (var item : order.getRepaymentPlan()) {
      Map<String, Object> row = new HashMap<>();
      row.put("periodNo", "第" + item.getPeriod() + "期");
      row.put("payDate", String.valueOf(item.getDueDate()));
      BigDecimal rentAmount = BigDecimal.valueOf(item.getAmount());
      BigDecimal totalAmount = rentAmount.add(depositPerPeriod);  // 总额 = 租金（押金为0）
      row.put("rentAmount", formatAmount(rentAmount));
      row.put("depositAmount", formatAmount(depositPerPeriod));  // 押金为0
      row.put("totalAmount", formatAmount(totalAmount));
      rows.add(row);
    }
    return rows;
  }

  private List<Map<String, Object>> buildDeliveryItems(Order order) {
    List<Map<String, Object>> rows = new ArrayList<>();
    Map<String, Object> row = new HashMap<>();
    row.put("itemName", safe(order.getProductName()));
    row.put("itemModel", resolveProductSpec(order));
    row.put("itemQty", "1");
    rows.add(row);
    return rows;
  }

  private String extractLeaseStart(Order order) {
    if (order.getRepaymentPlan() == null || order.getRepaymentPlan().isEmpty()) return "";
    return String.valueOf(order.getRepaymentPlan().get(0).getDueDate());
  }

  private String extractLeaseEnd(Order order) {
    if (order.getRepaymentPlan() == null || order.getRepaymentPlan().isEmpty()) return "";
    return String.valueOf(order.getRepaymentPlan().get(order.getRepaymentPlan().size() - 1).getDueDate());
  }

  private String extractHomeAddress(Order order) {
    List<String> parts = new ArrayList<>();
    String provinceName = resolveRegionName(order.getHomeProvinceCode());
    String cityName = resolveRegionName(order.getHomeCityCode());
    String districtName = resolveRegionName(order.getHomeDistrictCode());
    if (provinceName != null && !provinceName.isBlank()) parts.add(provinceName);
    if (cityName != null && !cityName.isBlank()) parts.add(cityName);
    if (districtName != null && !districtName.isBlank()) parts.add(districtName);
    if (order.getHomeAddressDetail() != null && !order.getHomeAddressDetail().isBlank()) {
      parts.add(order.getHomeAddressDetail());
    }
    return String.join("", parts);
  }

  /**
   * 解析车型规格：品牌名 + 产品名（如"九号m385c"）。
   * 通过 order.productId → product.categoryId → category.name 获取品牌。
   */
  private String resolveProductSpec(Order order) {
    String productName = safe(order.getProductName());
    if (order.getProductId() == null || order.getProductId().isBlank()) return productName;
    try {
      var productOpt = productRepository.findById(order.getProductId());
      if (productOpt.isEmpty()) return productName;
      String categoryId = productOpt.get().getCategoryId();
      if (categoryId == null || categoryId.isBlank()) return productName;
      var categoryOpt = categoryRepository.findById(categoryId);
      if (categoryOpt.isEmpty()) return productName;
      String brandName = categoryOpt.get().getName();
      if (brandName == null || brandName.isBlank()) return productName;
      if (productName.startsWith(brandName)) return productName;
      return brandName + productName;
    } catch (Exception e) {
      return productName;
    }
  }

  private String resolveRegionName(String code) {
    if (code == null || code.isBlank()) return null;
    return regionRepository.findById(code)
      .map(region -> RegionNameUtil.normalize(region.getName()))
      .orElse(null);
  }

  private Instant parseInstant(String value) {
    if (value == null || value.isBlank()) return Instant.now();
    try {
      return Instant.parse(value.trim());
    } catch (Exception ex) {
      try {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        LocalDateTime local = LocalDateTime.parse(value.trim(), formatter);
        return local.atZone(ZoneId.of("Asia/Shanghai")).toInstant();
      } catch (Exception ignored) {
        return Instant.now();
      }
    }
  }

  private Path resolveUploadDir() {
    String dir = appProperties.getUpload().getDir();
    if (dir == null || dir.isBlank()) dir = "uploads";
    return Path.of(dir).toAbsolutePath().normalize();
  }

  private String sanitize(String value) {
    if (value == null) return "unknown";
    return value.replaceAll("[^A-Za-z0-9_-]", "_");
  }

  private String formatAmount(BigDecimal value) {
    if (value == null) return "0.00";
    return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
  }

  private String safe(String value) {
    return value == null ? "" : value;
  }
}
