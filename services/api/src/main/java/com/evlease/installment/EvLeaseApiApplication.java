package com.evlease.installment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class EvLeaseApiApplication {
  public static void main(String[] args) {
    SpringApplication.run(EvLeaseApiApplication.class, args);
  }
}

