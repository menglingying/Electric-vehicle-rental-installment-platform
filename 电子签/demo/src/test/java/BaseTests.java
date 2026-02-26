import com.ancun.netsign.client.NetSignClient;
import org.junit.Before;

public class BaseTests {

    // 测试环境 接入者配置
    //测试只需改下appid。有问题联系爱签技术
    private static final String appId = readEnv("ASIGN_APP_ID");
    private static final String privateKey = readEnv("ASIGN_PRIVATE_KEY");
    private static final String baseUrl = readEnv("ASIGN_BASE_URL", "https://prev.asign.cn/");

    NetSignClient netSignClient = null;

    @Before
    public void initClient() {
        //测试地址
        netSignClient = new NetSignClient(baseUrl, appId, privateKey);
    }

    private static String readEnv(String key) {
        String value = System.getenv(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing env var: " + key);
        }
        return value.trim();
    }

    private static String readEnv(String key, String defaultValue) {
        String value = System.getenv(key);
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        return value.trim();
    }
}
