package com.evlease.installment.service;

import com.evlease.installment.model.Contract;
import com.evlease.installment.model.Order;
import com.evlease.installment.model.PaymentIntent;
import com.evlease.installment.model.RepaymentPlanItem;
import com.evlease.installment.model.RepaymentRecord;
import com.evlease.installment.repo.ContractRepository;
import com.evlease.installment.repo.PaymentRepository;
import com.evlease.installment.repo.RegionRepository;
import com.evlease.installment.util.RegionNameUtil;
import com.evlease.installment.repo.RepaymentRepository;
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
  private final RegionRepository regionRepository;
  private final Map<String, String> regionNameCache = new ConcurrentHashMap<>();

  public OrderEnricher(
    RepaymentRepository repaymentRepository,
    ContractRepository contractRepository,
    PaymentRepository paymentRepository,
    RegionRepository regionRepository
  ) {
    this.repaymentRepository = repaymentRepository;
    this.contractRepository = contractRepository;
    this.paymentRepository = paymentRepository;
    this.regionRepository = regionRepository;
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

    List<RepaymentPlanItem> plan = new ArrayList<>();
    long remainingAmount = 0;
    var rawPlan = order.getRepaymentPlan();
    if (rawPlan != null) {
      for (var p : rawPlan) {
        var item = new RepaymentPlanItem(p.getPeriod(), p.getDueDate(), p.getAmount());
        boolean paid = paidPeriods.getOrDefault(p.getPeriod(), false);
        item.setPaid(paid);
        plan.add(item);
        if (!paid) remainingAmount += p.getAmount();
      }
    }

    Contract contract = contractRepository.findById(order.getId()).orElse(null);
    PaymentIntent payment = paymentRepository.findFirstByOrderIdOrderByCreatedAtDesc(order.getId()).orElse(null);

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
