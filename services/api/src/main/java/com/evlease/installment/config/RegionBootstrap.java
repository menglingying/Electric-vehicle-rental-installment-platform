package com.evlease.installment.config;

import com.evlease.installment.model.Region;
import com.evlease.installment.repo.RegionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class RegionBootstrap implements ApplicationRunner {
  private static final Logger log = LoggerFactory.getLogger(RegionBootstrap.class);
  private static final long MIN_REGION_COUNT = 1000;

  private final RegionRepository regionRepository;
  private final ObjectMapper objectMapper;

  public RegionBootstrap(RegionRepository regionRepository, ObjectMapper objectMapper) {
    this.regionRepository = regionRepository;
    this.objectMapper = objectMapper;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (regionRepository.count() >= MIN_REGION_COUNT) {
      return;
    }

    var resource = new ClassPathResource("regions/pca-code.json");
    if (!resource.exists()) {
      log.warn("Region data file not found, skip bootstrap");
      return;
    }

    try (InputStream input = resource.getInputStream()) {
      var nodes = objectMapper.readValue(input, new TypeReference<List<RegionNode>>() {});
      var regions = new ArrayList<Region>(4096);
      collect(nodes, 1, null, regions);
      regionRepository.saveAll(regions);
      log.info("Bootstrapped {} regions", regions.size());
    } catch (Exception ex) {
      log.error("Failed to bootstrap regions", ex);
    }
  }

  private void collect(List<RegionNode> nodes, int level, String parentCode, List<Region> out) {
    if (nodes == null || nodes.isEmpty()) {
      return;
    }
    int sort = 1;
    for (var node : nodes) {
      var code = normalizeCode(node.code());
      out.add(new Region(code, node.name(), level, parentCode, sort++));
      collect(node.children(), level + 1, code, out);
    }
  }

  private String normalizeCode(String code) {
    if (code == null) return "";
    var trimmed = code.trim();
    if (trimmed.length() == 2) return trimmed + "0000";
    if (trimmed.length() == 4) return trimmed + "00";
    return trimmed;
  }

  public record RegionNode(String code, String name, List<RegionNode> children) {}
}
