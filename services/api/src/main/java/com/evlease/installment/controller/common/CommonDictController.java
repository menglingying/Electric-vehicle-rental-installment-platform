package com.evlease.installment.controller.common;

import com.evlease.installment.model.DictItem;
import com.evlease.installment.repo.DictItemRepository;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/common/dicts")
public class CommonDictController {
  private static final Map<String, List<DictItemResponse>> DEFAULT_DICTS = Map.of(
    "employment_status",
    List.of(
      new DictItemResponse("employed", "全职"),
      new DictItemResponse("part_time", "兼职"),
      new DictItemResponse("freelancer", "自由职业"),
      new DictItemResponse("self_employed", "个体经营"),
      new DictItemResponse("student", "学生"),
      new DictItemResponse("unemployed", "无业"),
      new DictItemResponse("retired", "退休")
    ),
    "income_range",
    List.of(
      new DictItemResponse("0_1000", "0-1000"),
      new DictItemResponse("1000_2000", "1000-2000"),
      new DictItemResponse("2001_3000", "2001-3000"),
      new DictItemResponse("3001_4000", "3001-4000"),
      new DictItemResponse("4001_5000", "4001-5000"),
      new DictItemResponse("5001_8000", "5001-8000"),
      new DictItemResponse("8001_12000", "8001-12000"),
      new DictItemResponse("12001_20000", "12001-20000"),
      new DictItemResponse("20000_plus", "20000+")
    ),
    "contact_relation",
    List.of(
      new DictItemResponse("parent", "父母"),
      new DictItemResponse("spouse", "配偶"),
      new DictItemResponse("child", "子女"),
      new DictItemResponse("colleague", "同事"),
      new DictItemResponse("friend", "朋友"),
      new DictItemResponse("other", "其他")
    )
  );

  private final DictItemRepository dictItemRepository;

  public CommonDictController(DictItemRepository dictItemRepository) {
    this.dictItemRepository = dictItemRepository;
  }

  @GetMapping("/{dictCode}")
  public List<DictItemResponse> list(@PathVariable String dictCode) {
    var items = dictItemRepository.findByDictCodeAndStatusOrderBySortAsc(dictCode, 1);
    if (items == null || items.isEmpty()) {
      return DEFAULT_DICTS.getOrDefault(dictCode, List.of());
    }
    return items.stream().map(i -> new DictItemResponse(i.getItemCode(), i.getItemLabel())).toList();
  }

  public record DictItemResponse(String code, String label) {}
}
