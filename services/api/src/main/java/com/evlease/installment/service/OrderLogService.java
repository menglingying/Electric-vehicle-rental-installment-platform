package com.evlease.installment.service;

import com.evlease.installment.model.Order;
import com.evlease.installment.model.OrderLog;
import java.time.Instant;
import java.util.ArrayList;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class OrderLogService {
  public void add(Order order, String action, String by) {
    add(order, action, by, null);
  }

  public void add(Order order, String action, String by, java.util.function.Consumer<OrderLog> fill) {
    if (order.getStatusLogs() == null) order.setStatusLogs(new ArrayList<>());
    var log = new OrderLog("log_" + UUID.randomUUID().toString().replace("-", ""), action, order.getStatus(), Instant.now(), by);
    if (fill != null) fill.accept(log);
    order.getStatusLogs().add(0, log);
  }
}

