---
autoGroup-1:   架构
---

# 服务调用

## 基本介绍

- Feign

Feign 是`Spring Cloud Netflix`组件中的一量级`Restful`的 HTTP 服务客户端，实现了负载均衡和 Rest 调用的开源框架，封装了`Ribbon`和`RestTemplate`, 实现了`WebService`的面向接口编程，进一步降低了项目的耦合度。

- 什么是服务调用

顾名思义，就是服务之间的接口互相调用，在微服务架构中很多功能都需要调用多个服务才能完成某一项功能。

- 为什么要使用Feign

Feign 旨在使编写 JAVA HTTP 客户端变得更加简单，Feign 简化了`RestTemplate`代码，实现了`Ribbon`负载均衡，使代码变得更加简洁，也少了客户端调用的代码，使用 Feign 实现负载均衡是首选方案，只需要你创建一个接口，然后在上面添加注解即可。
 Feign 是声明式服务调用组件，其核心就是：像调用本地方法一样调用远程方法，无感知远程 HTTP 请求。让开发者调用远程接口就跟调用本地方法一样的体验，开发者完全无感知这是远程方法，无需关注与远程的交互细节，更无需关注分布式环境开发。

- Feign vs OpenFeign

Feign 内置了`Ribbon`，用来做客户端负载均衡调用服务注册中心的服务。
 Feign 支持的注解和用法参考官方文档：`https://github.com/OpenFeign/feign`官方文档，使用 Feign 的注解定义接口，然后调用这个接口，就可以调用服务注册中心的服务。

`Feign`本身并不支持`Spring MVC`的注解，它有一套自己的注解，为了更方便的使用`Spring Cloud`孵化了`OpenFeign`。并且支持了`Spring MVC`的注解，如`@RequestMapping`，`@PathVariable`等等。
 `OpenFeign`的`@FeignClient`可以解析`Spring MVC`的`@RequestMapping`注解下的接口，并通过动态代理方式产生实现类，实现类中做负载均衡调用服务。

## 如何使用

1、添加依赖

```xml
<!-- spring cloud openfeign -->
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

2、新建`RemoteUserService.java`服务接口

```java
package com.twelvet.system.api;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.twelvet.common.core.constant.ServiceNameConstants;
import com.twelvet.common.core.domain.R;
import com.twelvet.system.api.factory.RemoteUserFallbackFactory;
import com.twelvet.system.api.model.LoginUser;

/**
 * 用户服务
 * 
 * @author twelvet
 */
@FeignClient(contextId = "remoteUserService", value = ServiceNameConstants.SYSTEM_SERVICE, fallbackFactory = RemoteUserFallbackFactory.class)
public interface RemoteUserService
{
    /**
     * 通过用户名查询用户信息
     *
     * @param username 用户名
     * @return 结果
     */
    @GetMapping(value = "/user/info/{username}")
    public R<LoginUser> getUserInfo(@PathVariable("username") String username);
}
```

3、新建`RemoteUserFallbackFactory.java`降级实现

```java
package com.twelvet.system.api.factory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import com.twelvet.common.core.domain.R;
import com.twelvet.system.api.RemoteUserService;
import com.twelvet.system.api.model.LoginUser;
import feign.hystrix.FallbackFactory;

/**
 * 用户服务降级处理
 * 
 * @author twelvet
 */
@Component
public class RemoteUserFallbackFactory implements FallbackFactory<RemoteUserService>
{
    private static final Logger log = LoggerFactory.getLogger(RemoteUserFallbackFactory.class);

    @Override
    public RemoteUserService create(Throwable throwable)
    {
        log.error("用户服务调用失败:{}", throwable.getMessage());
        return new RemoteUserService()
        {
            @Override
            public R<LoginUser> getUserInfo(String username)
            {
                return R.fail("获取用户失败:" + throwable.getMessage());
            }
        };
    }
}
```

4、消费者`TestUserController.java`新增`info`查询用户方法

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestUserController
{
    @Autowired
    private RemoteUserService remoteUserService;

    /**
     * 获取当前用户信息
     */
    @GetMapping("/user/{username}")
    public Object info(@PathVariable("username") String username)
    {
        return remoteUserService.getUserInfo(username);
    }
}
```

5、启动类添加`@EnableRyFeignClients`注解，默认的`@EnableRyFeignClients`扫描范围`com.twelvet`。

6、启动后访问`http://localhost:88/user/admin`，返回正确数据表示测试通过。

提示

目前已经存在`twelvet-api-system`系统接口模块，用于服务调用。

## 负载均衡

`Feign`默认集成了`Ribbon`，`Nacos`也很好的兼容了`Feign`，默认实现了负载均衡的效果。

## 请求传参

`Get`方式传参，使用`@PathVariable`、`@RequestParam`注解接收请求参数

```java
@GetMapping(value = "/user/info/{username}")
public R<LoginUser> getUserInfo(@PathVariable("username") String username);
```

`Post`方式传参，使用`@RequestBody`注解接收请求参数。

```java
@PostMapping("/operlog")
public R<Boolean> saveLog(@RequestBody SysOperLog sysOperLog);
```

## 性能优化

### Gzip压缩

`gzip`是一种数据格式，采用`deflate`算法压缩数据。`gzip`大约可以帮我们减少`70%`以上的文件大小。

全局配置

```yml
server:
  compression:
    # 是否开启压缩
    enabled: true
    # 配置支持压缩的 MIME TYPE
    mime-types: text/html,text/xml,text/plain,application/xml,application/json
```

局部配置

```yml
feign:
  compression:
    request:
      # 开启请求压缩
      enabled: true
      # 配置压缩支持的 MIME TYPE
      mime-types: text/xml,application/xml,application/json 
      # 配置压缩数据大小的下限
      min-request-size: 2048   
    response:
      # 开启响应压缩
      enabled: true  
```

提示

开启压缩可以有效节约网络资源，但是会增加CPU压力，建议把最小压缩的文档大小适度调大一点。

### Http连接池

两台服务器建立`HTTP`连接的过程涉及到多个数据包的交换，很消耗时间。采用`HTTP`连接池可以节约大量的时间提示吞吐量。

`Feign`的`HTTP`客户端支持3种框架：`HttpURLConnection`、`HttpClient`、`OkHttp`。

默认是采用`java.net.HttpURLConnection`，每次请求都会建立、关闭连接，为了性能考虑，可以引入`httpclient`、`okhttp`作为底层的通信框架。

例如将`Feign`的`HTTP`客户端工具修改为`HttpClient`。

1、添加依赖

```xml
<!-- feign httpclient -->
<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-httpclient</artifactId>
</dependency>
```

2、全局配置

```yml
feign:
  httpclient:
    # 开启httpclient
    enabled: true
```

3、测试验证

```java
// RemoteUserService FeignClient
@GetMapping("/user/pojo")
public Object selectUser(SysUser user);


// 消费端
@Autowired
private RemoteUserService remoteUserService;

@GetMapping("/user/pojo")
public Object UserInfo(SysUser user)
{
	return remoteUserService.selectUser(user);
}

// 服务端
@GetMapping("/pojo")
public R<SysUser> selectUser(@RequestBody SysUser user)
{
	return R.ok(userService.selectUserByUserName(user.getUserName()));
}
```

4、启动后访问`http://localhost:88/user/pojo?userName=ry`，返回正确数据表示测试通过。

### 日志配置

浏览器发起的请求可以通过`F12`查看请求和响应信息。如果想看微服务中每个接口我们可以使用日志配置方式进行查看详细信息。

配置文件`logback.xml`设置`com.twelvet`日志级别为`debug`

全局配置

```java
@Bean
public Logger.Level getLog()
{
	return Logger.Level.FULL;
}
```

局部配置

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import feign.Logger;

/**
 * Feign 客户端配置
 *
 * @author twelvet
 */
@Configuration
public class FeignConfiguration
{
    @Bean
    Logger.Level feignLoggerLevel()
    {
        return Logger.Level.FULL;
    }
}

// ====== 在客户端接口指定此配置 ======

/**
 * 用户服务
 * 
 * @author twelvet
 */
@FeignClient(contextId = "remoteUserService", value = ServiceNameConstants.SYSTEM_SERVICE, fallbackFactory = RemoteUserFallbackFactory.class, configuration = FeignConfiguration.class)
public interface RemoteUserService
{
} 
```

### 请求超时

`Feign`的负载均衡底层用的就是`Ribbon`，所以请求超时其实就只需要配置`Ribbon`参数。

全局配置

```yml
# 请求处理的超时时间
ribbon:
  ReadTimeout: 10000
  ConnectTimeout: 10000
```

局部配置

```yml
# twelvet-xxxx 为需要调用的服务名称
twelvet-xxxx:
  ribbon:
    ReadTimeout: 10000
    ConnectTimeout: 10000
```

## 异常配置

1、配置开启

```yml
feign:
  hystrix:
    enabled: true
```

2、`FeignClient`接口服务加入`fallbackFactory`

```java
@FeignClient(fallbackFactory = RemoteUserFallbackFactory.class)
```

3、添加接口实现异常类

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import feign.hystrix.FallbackFactory;

/**
 * 用户服务降级处理
 * 
 * @author twelvet
 */
@Component
public class RemoteUserFallbackFactory implements FallbackFactory<RemoteUserService>
{
    private static final Logger log = LoggerFactory.getLogger(RemoteUserFallbackFactory.class);

    @Override
    public RemoteUserService create(Throwable throwable)
    {
        log.error("用户服务调用失败:{}", throwable.getMessage());
        return new RemoteUserService()
        {
            @Override
            public Object getUserInfo(String username)
            {
                return "获取用户失败:" + throwable.getMessage();
            }
        };
    }
}
```

## 请求拦截器

在微服务应用中，通过`feign`的方式实现`http`的调用，可以通过实现`feign.RequestInterceptor`接口在`feign`执行后进行拦截，对请求头等信息进行修改。

例如项目中利用`feign`拦截器将本服务的`userId`、`userName`、`authentication`传递给下游服务

```java
package com.twelvet.common.security.feign;

import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import com.twelvet.common.core.constant.CacheConstants;
import com.twelvet.common.core.utils.ServletUtils;
import com.twelvet.common.core.utils.StringUtils;
import feign.RequestInterceptor;
import feign.RequestTemplate;

/**
 * feign 请求拦截器
 * 
 * @author twelvet
 */
@Component
public class FeignRequestInterceptor implements RequestInterceptor
{
    @Override
    public void apply(RequestTemplate requestTemplate)
    {
        HttpServletRequest httpServletRequest = ServletUtils.getRequest();
        if (StringUtils.isNotNull(httpServletRequest))
        {
            Map<String, String> headers = ServletUtils.getHeaders(httpServletRequest);
            // 传递用户信息请求头，防止丢失
            String userId = headers.get(CacheConstants.DETAILS_USER_ID);
            if (StringUtils.isNotEmpty(userId))
            {
                requestTemplate.header(CacheConstants.DETAILS_USER_ID, userId);
            }
            String userName = headers.get(CacheConstants.DETAILS_USERNAME);
            if (StringUtils.isNotEmpty(userName))
            {
                requestTemplate.header(CacheConstants.DETAILS_USERNAME, userName);
            }
            String authentication = headers.get(CacheConstants.AUTHORIZATION_HEADER);
            if (StringUtils.isNotEmpty(authentication))
            {
                requestTemplate.header(CacheConstants.AUTHORIZATION_HEADER, authentication);
            }
        }
    }
}
```