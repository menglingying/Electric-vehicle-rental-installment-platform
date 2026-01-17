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

    if (depositRatio <= 0) return items;

    var totalRent = (long) rentPerCycle * periods;
    var deposit = Math.round(totalRent * depositRatio);
    var remaining = (int) Math.min(Integer.MAX_VALUE, deposit);

    for (int i = items.size() - 1; i >= 0 && remaining > 0; i--) {
      var amount = items.get(i).getAmount();
      var offset = Math.min(amount, remaining);
      items.get(i).setAmount(amount - offset);
      remaining -= offset;
    }

    return items;
  }
}
