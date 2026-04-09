package com.evlease.installment.service;

import com.evlease.installment.model.RepaymentPlanItem;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class OrderPlanService {
  public List<RepaymentPlanItem> buildRentPlan(int rentPerCycle, int periods, int cycleDays, double depositRatio) {
    var today = LocalDate.now();
    var items = new ArrayList<RepaymentPlanItem>();
    for (int i = 1; i <= periods; i++) {
      var dueDate = today.plusDays((long) cycleDays * i);
      items.add(new RepaymentPlanItem(i, dueDate, rentPerCycle));
    }
    return items;
  }
}
