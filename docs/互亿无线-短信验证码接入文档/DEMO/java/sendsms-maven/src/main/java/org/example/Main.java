package org.example;

import java.util.concurrent.TimeUnit;
import java.io.IOException;

import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.JSONArray;

public class Main {
    public static void main(String[] args) {
        // 创建一个HttpClientBuilder实例
        CloseableHttpClient httpClient = HttpClients.custom()
                // 配置连接超时时间（毫秒）
                .setConnectionTimeToLive(5000, TimeUnit.MILLISECONDS)
                // 配置请求超时时间（毫秒）
                .setDefaultRequestConfig(RequestConfig.custom()
                        .setConnectTimeout(5000)
                        .setSocketTimeout(5000)
                        .build())
                // 可以继续添加其他配置，如设置代理、SSL上下文等
                .build();

        try {
            // 创建一个POST请求
            HttpPost httpPost = new HttpPost("http://106.ihuyi.com/webservice/sms.php?method=Submit");

            httpPost.setHeader("Content-Type", "application/x-www-form-urlencoded;");
            StringEntity entity = new StringEntity("account=xxxxxxxx&password=xxxxxxx&mobile=333333&content=sddddddd&format=json", "UTF-8");

            httpPost.setEntity(entity);
            CloseableHttpResponse response = httpClient.execute(httpPost);

            try {
                // 打印响应状态码
                System.out.println("Status code: " + response.getStatusLine().getStatusCode());
                String res = EntityUtils.toString(response.getEntity(), "UTF-8");
                System.out.println(res);
                JSONObject jsonObject = JSON.parseObject(res);
                System.out.println(jsonObject);
                int code = jsonObject.getIntValue("code"); // 状态码
                String msg = jsonObject.getString("msg"); // 状态描述
                String smsid = jsonObject.getString("smsid"); //流水号
                if(code == 2){
                    System.out.println("提交成功");
                }else{
                    System.out.println("提交失败");
                }
                System.out.println("状态码：" + code);
                System.out.println("状态描述：" + msg);
                System.out.println("流水号：" + smsid);
            } finally {
                // 关闭响应
                response.close();
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            // 关闭HttpClient
            try {
                httpClient.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}