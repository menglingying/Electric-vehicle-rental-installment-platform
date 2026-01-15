/**
 * 接口类型：短信
 * 测试环境：win10 node v11.11.0 npm install querystring
 * 测试日期：2022-02-04
 * 使用说明：demo只包含了对接时需要的传参和解析的核心代码，可参考整合到自己的系统中，具体业务细节代码可根据自己的需要进行调整及优化。
 */

var http = require('http')
var querystring = require('querystring');

function post(hostname, path, post_data, callback){
	var options = {
		hostname: hostname,
		port: 80,
		path: path,
		method: 'POST',
		headers: {
			'Content-Type':'application/x-www-form-urlencoded',
			'Content-Length': post_data.length
		}
	}
	var req = http.request(options, function(res){
		var body ="";
		res.setEncoding('utf8');
		res.on('data', function(chunk){
			//console.log(chunk.toString());
			body += chunk;
		});
		res.on('end', function(){
			var json = JSON.parse(body);
			callback(json)
		});
	});
	req.on('error', function(e){
		console.log('msg:'+e.message);
	});
	req.write(post_data);
	req.end();
}

//定义请求的数据
var values = {
    'account':'xxxxxxxx',
    'password':'xxxxxxxxxxxx',
    'mobile':'134xxxxxxxx',
    'content':'您的验证码是：6583，请不要把验证码泄露给其他人。',
	'format':'json'
}
var post_data = querystring.stringify(values);

//发起请求
post("106.ihuyi.com", '/webservice/sms.php?method=Submit', post_data, function(json){
	//打印结果
	console.log(json);
})