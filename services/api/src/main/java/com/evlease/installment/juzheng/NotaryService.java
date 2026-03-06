package com.evlease.installment.juzheng;

import com.evlease.installment.config.AppProperties;
import com.evlease.installment.model.Order;
import com.evlease.installment.model.Product;
import com.evlease.installment.model.RepaymentPlanItem;
import com.evlease.installment.repo.ProductCategoryRepository;
import com.evlease.installment.repo.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.security.MessageDigest;
import java.util.*;

/**
 * 聚证租赁公证服务
 * 负责发起公证、查询状态、获取签署链接等
 */
@Service
public class NotaryService {
  
  private static final Logger log = LoggerFactory.getLogger(NotaryService.class);
  private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");
  
  // 公证类型：5-电动车/3C硬件租赁合同三方合同
  private static final int NOTARY_TYPE_EV_LEASE = 5;
  
  private final JuzhengClient client;
  private final JuzhengConfig config;
  private final AppProperties appProperties;
  private final ProductRepository productRepository;
  private final ProductCategoryRepository categoryRepository;
  
  public NotaryService(JuzhengClient client, JuzhengConfig config, AppProperties appProperties,
                       ProductRepository productRepository, ProductCategoryRepository categoryRepository) {
    this.client = client;
    this.config = config;
    this.appProperties = appProperties;
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
  }
  
  /**
   * 上传文件到聚证平台（通过文件流）
   * @param fileBytes 文件字节数组
   * @param fileName 文件名
   * @return 聚证平台的fileId
   */
  public String uploadFile(byte[] fileBytes, String fileName) throws Exception {
    // 文件上传接口不需要加密，使用multipart/form-data
    // 这里需要特殊处理，暂时返回模拟值
    log.info("上传文件到聚证: {}", fileName);
    // TODO: 实现文件上传
    return "file_" + UUID.randomUUID().toString().replace("-", "");
  }
  
  /**
   * 通过文件URL上传到聚证平台
   * @param fileUrl 文件URL（需公网可访问）
   * @param fileName 文件名
   * @param fileSize 文件大小（字节）
   * @param fileMd5 文件MD5值
   * @return 聚证平台的fileId
   */
  public String uploadFileByUrl(String fileUrl, String fileName, long fileSize, String fileMd5) throws Exception {
    String thirdFileId = UUID.randomUUID().toString().replace("-", "");
    
    Map<String, Object> fileInfo = new LinkedHashMap<>();
    fileInfo.put("thirdFileId", thirdFileId);
    fileInfo.put("fileUrl", fileUrl);
    fileInfo.put("fileSize", fileSize);
    fileInfo.put("fileName", fileName);
    fileInfo.put("fileMd5", fileMd5);
    
    Map<String, Object> params = Map.of("fileInfos", List.of(fileInfo));
    
    Map<String, Object> result = client.post("/api/fx/notary/uploadFileUrl", params);
    
    @SuppressWarnings("unchecked")
    List<Map<String, Object>> fileInfos = (List<Map<String, Object>>) result.get("fileInfos");
    if (fileInfos != null && !fileInfos.isEmpty()) {
      Map<String, Object> info = fileInfos.get(0);
      Object codeValue = info.get("code");
      String code = codeValue == null ? null : String.valueOf(codeValue);
      if ("E00000".equals(code) || "0".equals(code) || "200".equals(code)) {
        Object fileId = info.get("fileId");
        if (fileId == null) {
          throw new RuntimeException("Missing fileId in upload response");
        }
        return String.valueOf(fileId);
      }
      Object message = info.get("message");
      if (message == null) message = info.get("msg");
      throw new RuntimeException("文件上传失败: " + message);
    }
    throw new RuntimeException("文件上传响应异常");
  }

  public String applyLeaseNotary(Order order) throws Exception {
    ensureConfigReady();
    String idCardFrontFileId = resolveFileId(order, order.getIdCardFront(), "idCardFront");
    String idCardBackFileId = resolveFileId(order, order.getIdCardBack(), "idCardBack");
    return applyLeaseNotary(order, idCardFrontFileId, idCardBackFileId);
  }
  
  /**
   * 发起租赁公证申请
   * @param order 订单信息
   * @param idCardFrontFileId 身份证正面fileId
   * @param idCardBackFileId 身份证反面fileId
   * @return 聚证订单号(outOrderNo)
   */
  public String applyLeaseNotary(Order order, String idCardFrontFileId, String idCardBackFileId) throws Exception {
    ensureConfigReady();
    Map<String, Object> params = buildLeaseNotaryParams(order, idCardFrontFileId, idCardBackFileId);
    Map<String, Object> result = client.post("/api/fx/notary/apply", params);
    Object outOrderNo = result.get("outOrderNo");
    if (outOrderNo == null) {
      throw new RuntimeException("Missing outOrderNo in apply response");
    }
    return String.valueOf(outOrderNo);
  }
  
  /**
   * 构建租赁公证请求参数
   */
  private Map<String, Object> buildLeaseNotaryParams(Order order, String idCardFrontFileId, String idCardBackFileId) {
    Map<String, Object> params = new LinkedHashMap<>();
    
    // 公证类型
    params.put("notaryType", NOTARY_TYPE_EV_LEASE);
    
    // 订单发起人信息（使用企业法人）
    params.put("operatorName", config.getLegalName());
    params.put("operatorPhone", config.getLegalPhone());
    
    // 回调地址
    params.put("callbackUrl", config.getCallbackUrl());
    
    // 企业当事人信息（出租方）
    Map<String, Object> partyCompany = new LinkedHashMap<>();
    partyCompany.put("companyName", config.getCompanyName());
    partyCompany.put("companyAddress", config.getCompanyAddress());
    partyCompany.put("companyCertNo", config.getCompanyCertNo());
    partyCompany.put("legalName", config.getLegalName());
    partyCompany.put("legalCertNo", config.getLegalCertNo());
    partyCompany.put("legalPhone", config.getLegalPhone());
    params.put("partyCompany", partyCompany);
    
    // 自然人当事人信息（承租方/客户）
    Map<String, Object> partyPerson = new LinkedHashMap<>();
    partyPerson.put("name", order.getRealName());
    partyPerson.put("certNo", order.getIdCardNumber());
    partyPerson.put("phone", order.getPhone());
    partyPerson.put("email", order.getPhone() + "@placeholder.com"); // 邮箱必填，用手机号生成
    partyPerson.put("idCardFrontFileId", idCardFrontFileId);
    partyPerson.put("idCardBackFileId", idCardBackFileId);
    params.put("partyPerson", partyPerson);
    
    // 租赁信息
    Map<String, Object> lease = buildLeaseInfo(order);
    params.put("lease", lease);
    
    return params;
  }
  
  /**
   * 构建租赁信息
   */
  private Map<String, Object> buildLeaseInfo(Order order) {
    Map<String, Object> lease = new LinkedHashMap<>();
    
    lease.put("orderNo", order.getId());
    lease.put("deliveryAddress", order.getResidenceAddress() != null ? order.getResidenceAddress() : "待确认");
    lease.put("goodsName", order.getProductName());
    lease.put("spec", resolveProductSpec(order));
    lease.put("num", 1);
    
    // 从商品获取真实的每期租金（RepaymentPlanItem.amount 已扣除押金抵扣，不能直接用于公证合同）
    int rentPerCycle = resolveRentPerCycle(order);
    
    // 计算租赁时间
    List<RepaymentPlanItem> plan = order.getRepaymentPlan();
    if (plan != null && !plan.isEmpty()) {
      lease.put("startTime", plan.get(0).getDueDate().format(DATE_FORMAT));
      lease.put("endTime", plan.get(plan.size() - 1).getDueDate().format(DATE_FORMAT));
      
      // 计算总租金（系统金额单位为“元”，不做分转元）
      BigDecimal totalRent = BigDecimal.valueOf((long) rentPerCycle * plan.size());
      lease.put("totalRent", formatAmount(totalRent));
      
      // 总价金与总租金保持一致（业务要求）
      lease.put("compensation", formatAmount(totalRent));
      
      // 租金支付信息（每期显示真实租金）
      List<Map<String, Object>> payInfo = new ArrayList<>();
      for (RepaymentPlanItem item : plan) {
        Map<String, Object> pay = new LinkedHashMap<>();
        pay.put("payDate", item.getDueDate().format(DATE_FORMAT));
        pay.put("payAmount", formatAmount(BigDecimal.valueOf(rentPerCycle)));
        pay.put("payTerm", item.getPeriod());
        payInfo.add(pay);
      }
      lease.put("payInfo", payInfo);
    }
    
    return lease;
  }
  
  /**
   * 从商品获取真实的每期租金（根据电池选项）
   * RepaymentPlanItem.amount 是押金抵扣后的金额，不能用于公证合同
   */
  private int resolveRentPerCycle(Order order) {
    Product product = productRepository.findById(order.getProductId()).orElse(null);
    if (product == null) {
      log.warn("公证申请：商品不存在 productId={}, 回退使用还款计划金额", order.getProductId());
      List<RepaymentPlanItem> plan = order.getRepaymentPlan();
      if (plan != null && !plan.isEmpty()) {
        return plan.stream().mapToInt(RepaymentPlanItem::getAmount).max().orElse(0);
      }
      return 0;
    }
    
    String batteryOption = order.getBatteryOption();
    if ("WITH_BATTERY".equals(batteryOption) && product.getRentWithBattery() != null) {
      return product.getRentWithBattery();
    } else if ("WITHOUT_BATTERY".equals(batteryOption) && product.getRentWithoutBattery() != null) {
      return product.getRentWithoutBattery();
    }
    return product.getRentPerCycle();
  }

  private void ensureConfigReady() {
    if (isBlank(config.getBaseUrl())
      || isBlank(config.getClientId())
      || isBlank(config.getClientSecret())
      || isBlank(config.getPublicKey())
      || isBlank(config.getPrivateKey())) {
      throw new IllegalStateException("公证配置缺失：baseUrl/clientId/clientSecret/publicKey/privateKey");
    }
    if (isBlank(config.getCompanyName())
      || isBlank(config.getCompanyCertNo())
      || isBlank(config.getCompanyAddress())
      || isBlank(config.getLegalName())
      || isBlank(config.getLegalCertNo())
      || isBlank(config.getLegalPhone())
      || isBlank(config.getCallbackUrl())) {
      throw new IllegalStateException("公证配置缺失：企业/法人/回调信息未完整填写");
    }
  }

  private String resolveFileId(Order order, String fileUrl, String label) throws Exception {
    if (fileUrl == null || fileUrl.isBlank()) {
      throw new IllegalStateException("公证文件缺失: " + label);
    }

    String publicUrl = toPublicUrl(fileUrl);
    Path localPath = resolveLocalPath(fileUrl);
    if (localPath == null || !Files.exists(localPath)) {
      throw new IllegalStateException("公证文件不存在: " + label);
    }

    long fileSize = Files.size(localPath);
    String fileMd5 = md5Hex(localPath);
    String fileName = localPath.getFileName().toString();
    return uploadFileByUrl(publicUrl, fileName, fileSize, fileMd5);
  }

  private String toPublicUrl(String fileUrl) {
    String trimmed = fileUrl.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    String baseUrl = appProperties.getPublicBaseUrl();
    if (baseUrl == null || baseUrl.isBlank()) {
      throw new IllegalStateException("APP_PUBLIC_BASE_URL 未配置，无法生成公证文件公网地址");
    }
    if (trimmed.startsWith("/")) {
      return baseUrl + trimmed;
    }
    return baseUrl + "/" + trimmed;
  }

  private Path resolveLocalPath(String fileUrl) {
    String trimmed = fileUrl == null ? "" : fileUrl.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return null;
    String uploadDir = appProperties.getUpload().getDir();
    if (uploadDir == null || uploadDir.isBlank()) return null;
    Path dir = Path.of(uploadDir).toAbsolutePath().normalize();
    if (trimmed.startsWith("/uploads/")) {
      return dir.resolve(trimmed.substring("/uploads/".length())).normalize();
    }
    if (trimmed.startsWith("uploads/")) {
      return dir.resolve(trimmed.substring("uploads/".length())).normalize();
    }
    return dir.resolve(trimmed).normalize();
  }

  private String md5Hex(Path path) throws Exception {
    MessageDigest md5 = MessageDigest.getInstance("MD5");
    try (InputStream in = Files.newInputStream(path)) {
      byte[] buf = new byte[8192];
      int read;
      while ((read = in.read(buf)) != -1) {
        md5.update(buf, 0, read);
      }
    }
    byte[] digest = md5.digest();
    StringBuilder sb = new StringBuilder(digest.length * 2);
    for (byte b : digest) {
      sb.append(String.format("%02x", b));
    }
    return sb.toString();
  }

  /**
   * 解析车型规格：品牌名 + 产品名（如"九号m385c"）。
   * 通过 order.productId → product.categoryId → category.name 获取品牌。
   */
  private String resolveProductSpec(Order order) {
    String productName = order.getProductName() != null ? order.getProductName() : "";
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
      log.warn("解析公证商品规格失败: {}", e.getMessage());
      return productName;
    }
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }

  private String formatAmount(BigDecimal amount) {
    if (amount == null) return "0.00";
    return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
  }
  
  /**
   * 查询公证订单状态
   */
  public Map<String, Object> getOrderInfo(String outOrderNo) throws Exception {
    Map<String, Object> params = Map.of("outOrderNo", outOrderNo);
    return client.post("/api/fx/notary/getOrderInfo", params);
  }
  
  /**
   * 获取H5签署页面地址
   */
  public String getH5SignUrl(String outOrderNo, String partyCertNo) throws Exception {
    Map<String, Object> params = Map.of(
        "outOrderNo", outOrderNo,
        "partyCertNo", partyCertNo
    );
    Map<String, Object> result = client.post("/api/fx/notary/doAppletH5", params);
    return (String) result.get("signUrl");
  }
  
  /**
   * 获取浏览器跳转小程序链接（推荐）
   */
  public String getOpenLink(String outOrderNo, String partyCertNo) throws Exception {
    Map<String, Object> params = Map.of(
        "outOrderNo", outOrderNo,
        "partyCertNo", partyCertNo
    );
    Map<String, Object> result = client.post("/api/fx/notary/getOpenLink", params);
    return (String) result.get("openLink");
  }
  
  /**
   * 取消公证订单
   */
  public void cancelOrder(String outOrderNo, String abolishUser, String abolishReason) throws Exception {
    Map<String, Object> params = Map.of(
        "outOrderNo", outOrderNo,
        "abolishUser", abolishUser,
        "abolishReason", abolishReason
    );
    client.post("/api/fx/notary/cancel", params);
  }
  
  /**
   * 下载公证书
   */
  public Map<String, Object> getNotarizationDownloadUrl(String outOrderNo) throws Exception {
    Map<String, Object> params = Map.of("outOrderNo", outOrderNo);
    return client.post("/api/fx/notary/getNotarizationDownloadUrl", params);
  }
  
  /**
   * 下载订单文件（合同等）
   */
  public Map<String, Object> getAgreementFileDownloadUrl(String outOrderNo) throws Exception {
    Map<String, Object> params = Map.of("outOrderNo", outOrderNo);
    return client.post("/api/fx/notary/getAgreementFileDownloadUrl", params);
  }
}
