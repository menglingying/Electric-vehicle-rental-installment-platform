package com.evlease.installment.util;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

public final class RegionNameUtil {
  private RegionNameUtil() {}

  public static String normalize(String name) {
    if (name == null || name.isBlank()) return name;
    if (!looksMojibake(name)) return name;

    String decoded = decode(name, Charset.forName("Windows-1252"));
    if (containsCjk(decoded)) return decoded;

    decoded = decode(name, StandardCharsets.ISO_8859_1);
    return containsCjk(decoded) ? decoded : name;
  }

  private static String decode(String name, Charset source) {
    return new String(name.getBytes(source), StandardCharsets.UTF_8);
  }

  private static boolean looksMojibake(String name) {
    if (containsCjk(name)) return false;
    for (int i = 0; i < name.length(); i++) {
      if (name.charAt(i) >= 0x80) return true;
    }
    return false;
  }

  private static boolean containsCjk(String value) {
    for (int i = 0; i < value.length(); i++) {
      char ch = value.charAt(i);
      if (ch >= 0x4E00 && ch <= 0x9FFF) return true;
    }
    return false;
  }
}
