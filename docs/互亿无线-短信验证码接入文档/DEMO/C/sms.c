//接口类型：短信接口
//测试环境：centos7.8 gcc4.8.5
//测试日期：2022-01-26
//使用说明：demo只包含了对接时需要的传参和解析的核心代码，可参考整合到自己的系统中，具体业务细节代码可根据自己的需要进行调整及优化。
//linux下的编译：gcc -o test ./test.c
//linux下的执行：./test

//接口类型：互亿无线触发短信接口，支持发送验证码短信、订单通知短信等。
//账户注册：请通过该地址开通账户http://sms.ihuyi.com/register.html
//注意事项：
//（1）调试期间，请用默认的模板进行测试，默认模板详见接口文档；
//（2）请使用APIID（查看APIID请登录用户中心->验证码短信->产品总览->APIID）及APIkey来调用接口；
//（3）该代码仅供接入互亿无线短信接口参考使用，客户可根据实际需要自行编写；

#include <stdio.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <time.h>
#include <errno.h>
#include <signal.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>
#include <sys/time.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>

#define host "106.ihuyi.com"
#define PORT 80
#define BUFSIZE 4096

int main(int argc, char **argv)
{
    int sockfd, ret, i, h,srandnum;
    struct sockaddr_in servaddr;
    char str1[4096], str2[4096], buf[BUFSIZE], *str;
    socklen_t len;
    fd_set t_set1;
    struct timeval tv;

    if ((sockfd = socket(AF_INET, SOCK_STREAM, 0)) < 0 ) { //创建套接字
        printf("create connect error!\n"); //创建网络连接失败
        exit(0);
    };

    bzero(&servaddr, sizeof(servaddr)); //每个字节都用0填充
    servaddr.sin_family = AF_INET; //使用IPv4地址
    servaddr.sin_port = htons(PORT); //端口

    if (inet_aton(host, &servaddr.sin_addr) == 0){
        struct hostent *he;
        he = gethostbyname(host);
        if (he == NULL)
            return -1;
        memcpy(&servaddr.sin_addr, he->h_addr, sizeof(struct in_addr));
    }
    char ipbuf[128];
    strncpy(ipbuf, inet_ntoa(servaddr.sin_addr), 128); //将域名转成IP

    if (inet_pton(AF_INET, ipbuf, &servaddr.sin_addr) <= 0 ){
            printf("inet_pton error!\n"); //创建网络连接失败
            exit(0);
    };

    if (connect(sockfd, (struct sockaddr *)&servaddr, sizeof(servaddr)) < 0){
            printf("connect error!\n");
            exit(0);
    }
    printf("connect success!\n\n");

    //发送数据
    memset(str2, 0, 4096);
    strcat(str2, "account=xxxxxxxx&password=xxxxxxxxxxxx&mobile=139xxxxxxxx&content=您的验证码是：7328，请不要把验证码泄露给其他人。");
    str=(char *)malloc(128);
    len = strlen(str2);
    sprintf(str, "Content-Length: %d\r\n\r\n", len);

    memset(str1, 0, 4096);
    strcat(str1, "POST /webservice/sms.php?method=Submit&format=json HTTP/1.1\r\n");
    strcat(str1, "Host: ");
    strcat(str1, host);
    strcat(str1, "\r\n");
    strcat(str1, "Content-Type: application/x-www-form-urlencoded\r\n");
    strcat(str1, str);
    strcat(str1, str2);
    strcat(str1, "\r\n\r\n");
    printf("Request Data: \n%s\n",str1);

    ret = write(sockfd,str1,strlen(str1));
    if (ret < 0) {
        printf("send data fail！errno:%d, errmsg:'%s'\n\n",errno, strerror(errno));
        exit(0);
    }else{
        printf("send data success, length:%d byte!\n\n", ret);
    }

    FD_ZERO(&t_set1);
    FD_SET(sockfd, &t_set1);

    while(1){
        //sleep(1);
        tv.tv_sec= 0;
        tv.tv_usec= 0;
        h = select(sockfd+1, &t_set1, NULL, NULL, &tv);
        printf("h:%d sec:%ld usec:%ld\n\n", h, tv.tv_sec, tv.tv_usec);

        if (h == 0) {
            memset(buf, 0, 4096);
            i= read(sockfd, buf, 4095);
            if (i==0){
                close(sockfd);//关闭套接字
                printf("0.connect close！\n"); //读取数据报文时发现远端关闭
                return -1;
            }
            printf("Response Data: \n%s\n", buf);
            close(sockfd);//关闭套接字
            printf("1.connect close！\n");
            return 1;
        }

        if (h > 0) {
            close(sockfd);//关闭套接字
            printf("2.connect close！\n");
            return -1;
        };

        if (h < 0) {
            close(sockfd);//关闭套接字
            printf("3.connect close！\n"); //在读取数据报文时SELECT检测到异常
            return -1;
        };

        //continue;
        //break;
    }
    close(sockfd);//关闭套接字
    printf("4.connect close！\n");

    return 0;
}