package com.evlease.installment.controller.h5;

import com.evlease.installment.auth.AuthContext;
import com.evlease.installment.auth.PrincipalType;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.config.AppProperties;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.repo.RegionRepository;
import com.evlease.installment.service.OrderLogService;
import com.evlease.installment.util.RegionNameUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/h5")
public class H5KycController {
  private final AppProperties appProperties;
  private final OrderRepository orderRepository;
  private final OrderLogService orderLogService;
  private final RegionRepository regionRepository;

  public H5KycController(
    AppProperties appProperties,
    OrderRepository orderRepository,
    OrderLogService orderLogService,
    RegionRepository regionRepository
  ) {
    this.appProperties = appProperties;
    this.orderRepository = orderRepository;
    this.orderLogService = orderLogService;
    this.regionRepository = regionRepository;
  }

  public record UploadResponse(String url) {}

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public UploadResponse upload(HttpServletRequest request, @RequestParam("file") MultipartFile file) throws IOException {
    AuthContext.require(request, PrincipalType.H5);
    
    if (file == null || file.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "请选择文件");

    var contentType = file.getContentType();
    if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "仅支持图片文件");
    }

    var original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
    var ext = guessExt(original, contentType);
    var name = "kyc_" + UUID.randomUUID().toString().replace("-", "") + ext;

    var uploadDir = appProperties.getUpload().getDir();
    if (uploadDir == null || uploadDir.isBlank()) uploadDir = "uploads";
    var dir = Path.of(uploadDir).toAbsolutePath().normalize();
    Files.createDirectories(dir);

    var target = dir.resolve(name).normalize();
    if (!target.startsWith(dir)) throw new ApiException(HttpStatus.BAD_REQUEST, "非法文件名");

    file.transferTo(target);
    return new UploadResponse("/uploads/" + name);
  }

  public record KycSubmitRequest(
    @NotBlank String idCardFront,
    @NotBlank String idCardBack,
    @NotBlank String facePhoto,
    @NotBlank String realName,
    @NotBlank String idCardNumber,
    @NotBlank String contactName,
    @NotBlank String contactPhone,
    @NotBlank String contactRelation,
    @NotBlank String employmentStatus,
    @NotBlank String employmentName,
    @NotBlank String incomeRangeCode,
    @NotBlank String homeProvinceCode,
    @NotBlank String homeCityCode,
    @NotBlank String homeDistrictCode,
    @NotBlank String homeAddressDetail
  ) {}

  @PostMapping("/orders/{orderId}/kyc")
  public Object submitKyc(
    HttpServletRequest request,
    @PathVariable String orderId,
    @Valid @RequestBody KycSubmitRequest req
  ) {
    var principal = AuthContext.require(request, PrincipalType.H5);
    var order = orderRepository.findById(orderId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    
    if (!order.getPhone().equals(principal.phoneOrUsername())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "无权限");
    }

    order.setIdCardFront(req.idCardFront());
    order.setIdCardBack(req.idCardBack());
    order.setFacePhoto(req.facePhoto());
    order.setRealName(req.realName());
    order.setIdCardNumber(req.idCardNumber());
    order.setContactName(req.contactName());
    order.setContactPhone(req.contactPhone());
    order.setContactRelation(req.contactRelation());
    order.setEmploymentStatus(req.employmentStatus());
    order.setOccupation(req.employmentName());
    order.setIncomeRangeCode(req.incomeRangeCode());
    order.setHomeProvinceCode(req.homeProvinceCode());
    order.setHomeCityCode(req.homeCityCode());
    order.setHomeDistrictCode(req.homeDistrictCode());
    order.setHomeAddressDetail(req.homeAddressDetail());
    order.setResidenceAddress(buildResidenceAddress(
      req.homeProvinceCode(),
      req.homeCityCode(),
      req.homeDistrictCode(),
      req.homeAddressDetail()
    ));
    order.setKycCompleted(true);

    orderLogService.add(order, "KYC_SUBMITTED", "H5", l -> l.setActor(principal.phoneOrUsername()));
    orderRepository.save(order);

    return java.util.Map.of("success", true);
  }

  private String buildResidenceAddress(String provinceCode, String cityCode, String districtCode, String detail) {
    var parts = new ArrayList<String>();
    var provinceName = resolveRegionName(provinceCode);
    var cityName = resolveRegionName(cityCode);
    var districtName = resolveRegionName(districtCode);
    if (provinceName != null && !provinceName.isBlank()) parts.add(provinceName);
    if (cityName != null && !cityName.isBlank()) parts.add(cityName);
    if (districtName != null && !districtName.isBlank()) parts.add(districtName);
    if (detail != null && !detail.isBlank()) parts.add(detail);
    return String.join(" ", parts);
  }

  private String resolveRegionName(String code) {
    if (code == null || code.isBlank()) return null;
    return regionRepository.findById(code)
      .map(region -> RegionNameUtil.normalize(region.getName()))
      .orElse(code);
  }

  private String guessExt(String filename, String contentType) {
    var lower = filename.toLowerCase(Locale.ROOT);
    for (var ext : new String[] { ".png", ".jpg", ".jpeg", ".webp", ".gif" }) {
      if (lower.endsWith(ext)) return ext;
    }
    if (contentType == null) return "";
    var ct = contentType.toLowerCase(Locale.ROOT);
    if (ct.contains("png")) return ".png";
    if (ct.contains("jpeg") || ct.contains("jpg")) return ".jpg";
    if (ct.contains("webp")) return ".webp";
    if (ct.contains("gif")) return ".gif";
    return "";
  }
}
