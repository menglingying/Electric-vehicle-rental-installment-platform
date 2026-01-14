package com.evlease.installment.service;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

public class CsvUtil {
  private CsvUtil() {}

  private static String escape(Object v) {
    if (v == null) return "";
    var s = String.valueOf(v);
    if (s.contains("\"") || s.contains(",") || s.contains("\n") || s.contains("\r")) {
      return "\"" + s.replace("\"", "\"\"") + "\"";
    }
    return s;
  }

  public static byte[] toCsvBytes(List<List<Object>> rows) {
    var sb = new StringBuilder();
    for (int i = 0; i < rows.size(); i++) {
      var row = rows.get(i);
      for (int j = 0; j < row.size(); j++) {
        if (j > 0) sb.append(',');
        sb.append(escape(row.get(j)));
      }
      if (i < rows.size() - 1) sb.append("\r\n");
    }
    // UTF-8 BOM for Excel
    var bom = new byte[] {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
    var body = sb.toString().getBytes(StandardCharsets.UTF_8);
    var out = new byte[bom.length + body.length];
    System.arraycopy(bom, 0, out, 0, bom.length);
    System.arraycopy(body, 0, out, bom.length, body.length);
    return out;
  }

  public static void write(HttpServletResponse response, String filename, List<List<Object>> rows) throws IOException {
    var bytes = toCsvBytes(rows);
    response.setCharacterEncoding("UTF-8");
    response.setContentType("text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
    response.getOutputStream().write(bytes);
  }
}

