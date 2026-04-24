package com.evlease.installment.service;

import com.evlease.installment.model.Contract;
import com.evlease.installment.model.Order;
import com.evlease.installment.model.PaymentIntent;
import com.evlease.installment.model.Product;
import com.evlease.installment.model.RepaymentPlanItem;
import com.evlease.installment.model.RepaymentRecord;
import com.evlease.installment.repo.ContractRepository;
import com.evlease.installment.repo.PaymentRepository;
import com.evlease.installment.repo.ProductRepository;
import com.evlease.installment.repo.RegionRepository;
import com.evlease.installment.util.RegionNameUtil;
import com.evlease.installment.repo.RepaymentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class OrderEnricher {
  private final RepaymentRepository repaymentRepository;
  private final ContractRepository contractRepository;
  private final PaymentRepository paymentRepository;
  private final ProductRepository productRepository;
  private final RegionRepository regionRepository;
  private final Map<String, String> regionNameCache = new ConcurrentHashMap<>();
  private static final ObjectMapper META_MAPPER = new ObjectMapper();

  public OrderEnricher(
    RepaymentRepository repaymentRepository,
    ContractRepository contractRepository,
    PaymentRepository paymentRepository,
    ProductRepository productRepository,
    RegionRepository regionRepository
  ) {
    this.repaymentRepository = repaymentRepository;
    this.contractRepository = contractRepository;
    this.paymentRepository = paymentRepository;
    this.productRepository = productRepository;
    this.regionRepository = regionRepository;
  }

  /**
   * 从已签合同的 meta JSON 中抽取 rentPerPeriod 作为"冻结值"。
   * 合同签署时写入 meta.rentPerPeriod（AdminContractController.buildOrderMeta），
   * 法律层面就以该值为准；台账 DB 中的 amount 如果与合同不一致（多半是
   * 后续产品价格变动 / 重算导致的污染），读取侧自动以合同值覆盖，避免
   * 前端展示与合同金额脱节。返回 null 表示合同不存在 / 未签署 / 无金额。
   */
  public static Integer extractContractRentPerPeriod(Contract contract) {
    if (contract == null) return null;
    String status = contract.getStatus();
    if (status == null || !"SIGNED".equalsIgnoreCase(status)) return null;
    String meta = contract.getMeta();
    if (meta == null || meta.isBlank()) return null;
    try {
      JsonNode node = META_MAPPER.readTree(meta);
      JsonNode rent = node.get("rentPerPeriod");
      if (rent != null && rent.isNumber() && rent.intValue() > 0) return rent.intValue();
      if (rent != null && rent.isTextual()) {
        try { return Integer.parseInt(rent.asText().trim()); } catch (NumberFormatException ignored) {}
      }
    } catch (Exception ignored) {}
    return null;
  }

  private String resolveRegionName(String code) {
    if (code == null || code.isBlank()) return null;
    return regionNameCache.computeIfAbsent(code, key ->
      regionRepository.findById(key).map(region -> RegionNameUtil.normalize(region.getName())).orElse(key)
    );
  }

  public Map<String, Object> enrich(Order order) {
    List<RepaymentRecord> repaymentRecords = repaymentRepository.findByOrderIdOrderByPeriodAsc(order.getId());
    var paidPeriods = new HashMap<Integer, Boolean>();
    for (var r : repaymentRecords) {
      paidPeriods.put(r.getPeriod(), true);
    }

    Contract contract = contractRepository.findById(order.getId()).orElse(null);
    PaymentIntent payment = paymentRepository.findFirstByOrderIdOrderByCreatedAtDesc(order.getId()).orElse(null);

    // 台账：如果合同已签署且合同 meta 里记录了 rentPerPeriod，则以合同金额为准
    // 覆盖 plan 每期金额。合同是法律文件，必须是"只读真相源"。
    Integer contractRent = extractContractRentPerPeriod(contract);

    List<RepaymentPlanItem> plan = new ArrayList<>();
    long remainingAmount = 0;
    var rawPlan = order.getRepaymentPlan();
    if (rawPlan != null) {
      for (var p : rawPlan) {
        int amount = (contractRent != null) ? contractRent : p.getAmount();
        var item = new RepaymentPlanItem(p.getPeriod(), p.getDueDate(), amount);
        boolean paid = paidPeriods.getOrDefault(p.getPeriod(), false);
        item.setPaid(paid);
        plan.add(item);
        if (!paid) remainingAmount += amount;
      }
    }

    Map<String, Object> dto = new HashMap<>();
    dto.put("id", order.getId());
    dto.put("phone", order.getPhone());
    dto.put("productId", order.getProductId());
    dto.put("productName", order.getProductName());
    dto.put("periods", order.getPeriods());
    dto.put("cycleDays", order.getCycleDays());
    dto.put("depositRatio", order.getDepositRatio());
    dto.put("status", order.getStatus());
    dto.put("createdAt", order.getCreatedAt());
    dto.put("approvedAt", order.getApprovedAt());
    dto.put("rejectedAt", order.getRejectedAt());
    dto.put("deliveredAt", order.getDeliveredAt());
    dto.put("pickedUpAt", order.getPickedUpAt());
    dto.put("returnedAt", order.getReturnedAt());
    dto.put("settledAt", order.getSettledAt());
    dto.put("closedAt", order.getClosedAt());
    dto.put("repaymentPlan", plan);
    dto.put("repaymentRecords", repaymentRecords);
    dto.put("remainingAmount", remainingAmount);
    dto.put("contract", contract);
    dto.put("payment", payment);
    dto.put("statusLogs", order.getStatusLogs());
    
    // 电池配置与还款方式
    dto.put("batteryOption", order.getBatteryOption());
    dto.put("repaymentMethod", order.getRepaymentMethod());

    // 从 Product 获取具体电池型号/规格和车架配置
    String productId = order.getProductId();
    if (productId != null && !productId.isBlank()) {
      productRepository.findById(productId).ifPresent(product -> {
        dto.put("batteryConfig", product.getBatteryConfig());
        dto.put("frameConfig", product.getFrameConfig());
      });
    }
    
    // KYC信息
    dto.put("kycCompleted", order.isKycCompleted());
    dto.put("realName", order.getRealName());
    dto.put("idCardNumber", order.getIdCardNumber());
    dto.put("idCardFront", order.getIdCardFront());
    dto.put("idCardBack", order.getIdCardBack());
    dto.put("facePhoto", order.getFacePhoto());
    dto.put("occupation", order.getOccupation());
    dto.put("company", order.getCompany());
    dto.put("workCity", order.getWorkCity());
    dto.put("residenceAddress", order.getResidenceAddress());
    dto.put("residenceDuration", order.getResidenceDuration());
    dto.put("contactName", order.getContactName());
    dto.put("contactPhone", order.getContactPhone());
    dto.put("contactRelation", order.getContactRelation());
    dto.put("contactName2", order.getContactName2());
    dto.put("contactPhone2", order.getContactPhone2());
    dto.put("contactRelation2", order.getContactRelation2());
    dto.put("contactName3", order.getContactName3());
    dto.put("contactPhone3", order.getContactPhone3());
    dto.put("contactRelation3", order.getContactRelation3());
    dto.put("employmentStatus", order.getEmploymentStatus());
    dto.put("employmentName", order.getOccupation());
    dto.put("incomeRangeCode", order.getIncomeRangeCode());
    dto.put("homeProvinceCode", order.getHomeProvinceCode());
    dto.put("homeCityCode", order.getHomeCityCode());
    dto.put("homeDistrictCode", order.getHomeDistrictCode());
    dto.put("homeAddressDetail", order.getHomeAddressDetail());
    dto.put("homeProvinceName", resolveRegionName(order.getHomeProvinceCode()));
    dto.put("homeCityName", resolveRegionName(order.getHomeCityCode()));
    dto.put("homeDistrictName", resolveRegionName(order.getHomeDistrictCode()));

    // 公证信息
    dto.put("notaryOrderNo", order.getNotaryOrderNo());
    dto.put("notaryStatus", order.getNotaryStatus());
    dto.put("notaryCertifiedTime", order.getNotaryCertifiedTime());
    dto.put("notaryName", order.getNotaryName());
    dto.put("notaryCertUrl", order.getNotaryCertUrl());

    dto.put("asignSerialNo", order.getAsignSerialNo());
    dto.put("asignAuthResult", order.getAsignAuthResult());
    
    return dto;
  }
}
