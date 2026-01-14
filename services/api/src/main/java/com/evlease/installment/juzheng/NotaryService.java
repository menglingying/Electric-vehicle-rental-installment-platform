package com.evlease.installment.juzheng;

import com.evlease.installment.model.Order;
import com.evlease.installment.model.RepaymentPlanItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
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
  
  public NotaryService(JuzhengClient client, JuzhengConfig config) {
    this.client = client;
    this.config = config;
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
      if ("E00000".equals(info.get("code"))) {
        return (String) info.get("fileId");
      }
      throw new RuntimeException("文件上传失败: " + info.get("message"));
    }
    throw new RuntimeException("文件上传响应异常");
  }
  
  /**
   * 发起租赁公证申请
   * @param order 订单信息
   * @param idCardFrontFileId 身份证正面fileId
   * @param idCardBackFileId 身份证反面fileId
   * @return 聚证订单号(outOrderNo)
   */
  public String applyLeaseNotary(Order order, String idCardFrontFileId, String idCardBackFileId) throws Exception {
    Map<String, Object> params = buildLeaseNotaryParams(order, idCardFrontFileId, idCardBackFileId);
    Map<String, Object> result = client.post("/api/fx/notary/apply", params);
    return (String) result.get("outOrderNo");
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
    lease.put("spec", order.getBatteryOption() != null ? 
        ("WITH_BATTERY".equals(order.getBatteryOption()) ? "含电池" : "空车") : "标准配置");
    lease.put("num", 1);
    
    // 计算租赁时间
    List<RepaymentPlanItem> plan = order.getRepaymentPlan();
    if (plan != null && !plan.isEmpty()) {
      lease.put("startTime", plan.get(0).getDueDate().format(DATE_FORMAT));
      lease.put("endTime", plan.get(plan.size() - 1).getDueDate().format(DATE_FORMAT));
      
      // 计算总租金
      int totalRent = plan.stream().mapToInt(RepaymentPlanItem::getAmount).sum();
      lease.put("totalRent", String.format("%.2f", totalRent / 100.0));
      
      // 总价金（租赁物价值130%）
      lease.put("compensation", String.format("%.2f", totalRent * 1.3 / 100.0));
      
      // 租金支付信息
      List<Map<String, Object>> payInfo = new ArrayList<>();
      for (RepaymentPlanItem item : plan) {
        Map<String, Object> pay = new LinkedHashMap<>();
        pay.put("payDate", item.getDueDate().format(DATE_FORMAT));
        pay.put("payAmount", String.format("%.2f", item.getAmount() / 100.0));
        pay.put("payTerm", item.getPeriod());
        payInfo.add(pay);
      }
      lease.put("payInfo", payInfo);
    }
    
    return lease;
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
