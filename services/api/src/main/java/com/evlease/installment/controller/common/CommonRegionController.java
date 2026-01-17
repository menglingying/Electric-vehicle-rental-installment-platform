package com.evlease.installment.controller.common;

import com.evlease.installment.model.Region;
import com.evlease.installment.repo.RegionRepository;
import com.evlease.installment.util.RegionNameUtil;
import java.util.List;
import java.util.Objects;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/common/regions")
public class CommonRegionController {
  private final RegionRepository regionRepository;

  public CommonRegionController(RegionRepository regionRepository) {
    this.regionRepository = regionRepository;
  }

  @GetMapping
  public List<RegionItem> list(@RequestParam(required = false) String parentCode) {
    List<Region> regions;
    if (parentCode == null || parentCode.isBlank()) {
      regions = regionRepository.findByLevelOrderBySortAsc(1);
    } else {
      regions = regionRepository.findByParentCodeOrderBySortAsc(parentCode);
    }
    return regions.stream()
      .filter(Objects::nonNull)
      .map(r -> new RegionItem(r.getCode(), RegionNameUtil.normalize(r.getName())))
      .toList();
  }

  public record RegionItem(String code, String name) {}
}
