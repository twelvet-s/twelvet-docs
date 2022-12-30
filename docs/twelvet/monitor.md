---
autoGroup-1:   架构
---

# 服务监控

## 基本介绍

- 什么是服务监控

监视当前系统应用状态、内存、线程、堆栈、日志等等相关信息，主要目的在服务出现问题或者快要出现问题时能够准确快速地发现以减小影响范围。

- 为什么要使用服务监控

服务监控在微服务改造过程中的重要性不言而喻，没有强大的监控能力，改造成微服务架构后，就无法掌控各个不同服务的情况，在遇到调用失败时，如果不能快速发现系统的问题，对于业务来说就是一场灾难。

- spring boot actuator 服务监控接口

`actuator`是监控系统健康情况的工具。

- spring boot admin 服务监控管理

`Spring Boot Admin`是一个针对`spring-boot`的`actuator`接口进行UI美化封装的监控工具。他可以：在列表中浏览所有被监控`spring-boot`项目的基本信息，详细的Health信息、内存信息、JVM信息、垃圾回收信息、各种配置信息（比如数据源、缓存列表和命中率）等，还可以直接修改logger的level。

## 如何使用

1、添加依赖

```xml
<!-- SpringBoot Web -->
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- SpringBoot Actuator -->
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

2、在`application.yml`配置暴露所有监控端点

```yml
management:
  endpoints:
    web:
      exposure:
        include: '*'
```

3、监控启动类

```java
@SpringBootApplication
public class TWTMonitorApplication
{
    public static void main(String[] args)
    {
        SpringApplication.run(TWTMonitorApplication.class, args);
    }
}
```

4、启动后访问`http://localhost:9100/actuator`，返回正确数据表示测试通过。

## 端点分类

| 地址            | 描述                                              |
| --------------- | ------------------------------------------------- |
| /beans          | 显示所有的`Spring bean`列表                       |
| /caches         | 显示所有的缓存相关信息                            |
| /scheduledtasks | 显示所有的定时任务相关信息                        |
| /loggers        | 显示所有的日志相关信息                            |
| /configprops    | 显示所有的配置信息                                |
| /env            | 显示所有的环境变量信息                            |
| /mappings       | 显示所有控制器相关信息                            |
| /info           | 显示自定义用户信息配置                            |
| /metrics        | 显示应用指标相关信息                              |
| /health         | 显示健康检查状态信息，`up`表示成功 `down`表示失败 |
| /threaddump     | 显示程序线程的信息                                |

##ui) 整合`Admin-Ui`

1、添加依赖

```xml
<!-- SpringBoot Admin -->
<dependency>
	<groupId>de.codecentric</groupId>
	<artifactId>spring-boot-admin-starter-server</artifactId>
	<version>${spring-boot-admin.version}</version>
</dependency>
```

2、监控启动类

```java
@EnableAdminServer
@SpringBootApplication
public class TWTMonitorApplication
{
    public static void main(String[] args)
    {
        SpringApplication.run(TWTMonitorApplication.class, args);
    }
}
```

3、测试访问

浏览器访问([http://localhost:9100 (opens new window)](http://localhost:9100))可以看到以下界面。

![monitor](https://www.twelvet.cn/assets/images/docs/25c85e2d-ad89-43dc-8e3f-2482cd6eb098.png)

## 客户端配置

1、添加依赖

```xml
<!-- SpringBoot Admin Client -->
<dependency>
	<groupId>de.codecentric</groupId>
	<artifactId>spring-boot-admin-starter-client</artifactId>
</dependency>

<!-- SpringBoot Actuator -->
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

2、配置服务端地址

```yml
spring:
  application:
    name: twelvet-admin-client
  boot:
    admin:
      client:
        url: http://localhost:9100
```

## 集成Nacos

在使用`Admin`时，如果没有注册中心，需要各个客户端填写`Admin`服务端地址，而`Admin`是支持`Nacos`、`Eureka`、`ZooKeeper`等组件，可以直接从注册中心拉取服务实例

1、添加依赖

```xml
<!-- springcloud alibaba nacos discovery -->
<dependency>
	<groupId>com.alibaba.cloud</groupId>
	<artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

2、项目`yml`配置添加`nacos`地址，包含客户端和服务端

```yml
spring: 
  application:
    # 应用名称
    name: twelvet-xxxx 
  cloud:
    nacos:
      discovery:
        # 服务注册地址
        server-addr: 127.0.0.1:8848
```

## 登录认证

1、添加依赖

```xml
<!-- spring security -->
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

2、配置`spring security`权限

```java
package com.twelvet.modules.monitor.config;

import de.codecentric.boot.admin.server.config.AdminServerProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;

/**
 * 监控权限配置
 * 
 * @author twelvet
 */
@Configuration
public class WebSecurityConfigurer extends WebSecurityConfigurerAdapter
{
    private final String adminContextPath;

    public WebSecurityConfigurer(AdminServerProperties adminServerProperties)
    {
        this.adminContextPath = adminServerProperties.getContextPath();
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception
    {
        SavedRequestAwareAuthenticationSuccessHandler successHandler = new SavedRequestAwareAuthenticationSuccessHandler();
        successHandler.setTargetUrlParameter("redirectTo");
        successHandler.setDefaultTargetUrl(adminContextPath + "/");

        http
            .headers().frameOptions().disable()
            .and().authorizeRequests()
            .antMatchers(adminContextPath + "/assets/**"
                , adminContextPath + "/login"
                , adminContextPath + "/actuator/**"
                , adminContextPath + "/instances/**"
            ).permitAll()
            .anyRequest().authenticated()
            .and()
            .formLogin().loginPage(adminContextPath + "/login")
            .successHandler(successHandler).and()
            .logout().logoutUrl(adminContextPath + "/logout")
            .and()
            .httpBasic().and()
            .csrf()
            .disable();
    }
}
```

3、在`twelvet-monitor-dev.yml`配置用户，默认账户`twelvet/123456`

```yml
# spring
spring: 
  security:
    user:
      name: twelvet
      password: 123456
  boot:
    admin:
      ui:
        title: twelvet服务状态监控
```

## 实时日志

```
Spring Boot Admin`提供了基于`Web`页面的方式实时查看服务输出的本地日志，前提是服务中配置了`logging.file.name
```

以`twelvet-xxxx`模块为例，`bootstrap.yml`配置`logging.file.name`配置

```yml
logging:
  file:
    name: logs/${spring.application.name}/info.log
```

进入日志-日志文件`查看实时日志`，效果如下 ![config](https://www.twelvet.cn/assets/images/docs/3a2154c3-9621-4a5f-a753-a099cee8b392.png)

## 动态日志

`Spring Boot Admin`支持动态修改日志级别。

进入日志-日志配置`修改日志级别`，效果如下

![config](https://www.twelvet.cn/assets/images/docs/45513fe6-537f-46d6-9a24-a0db64eb3cd6.png)

## 自定义通知

可以通过添加实现`Notifier`接口的`Spring Beans`来添加您自己的通知程序。

```java
import org.springframework.stereotype.Component;
import de.codecentric.boot.admin.server.domain.entities.InstanceRepository;
import de.codecentric.boot.admin.server.domain.events.InstanceEvent;
import de.codecentric.boot.admin.server.domain.events.InstanceStatusChangedEvent;
import de.codecentric.boot.admin.server.notify.AbstractStatusChangeNotifier;
import reactor.core.publisher.Mono;

/**
 * 通知发送配置
 * 
 * @author twelvet
 */
@Component
public class TWTStatusChangeNotifier extends AbstractStatusChangeNotifier
{
    public TWTStatusChangeNotifier(InstanceRepository repository)
    {
        super(repository);
    }

    @Override
    protected Mono<Void> doNotify(InstanceEvent event,
            de.codecentric.boot.admin.server.domain.entities.Instance instance)
    {
        return Mono.fromRunnable(() -> {
            if (event instanceof InstanceStatusChangedEvent)
            {
                String status = ((InstanceStatusChangedEvent) event).getStatusInfo().getStatus();
                switch (status)
                {
                    // 健康检查没通过
                    case "DOWN":
                        System.out.println("发送 健康检查没通过 的通知！");
                        break;
                    // 服务离线
                    case "OFFLINE":
                        System.out.println("发送 服务离线 的通知！");
                        break;
                    // 服务上线
                    case "UP":
                        System.out.println("发送 服务上线 的通知！");
                        break;
                    // 服务未知异常
                    case "UNKNOWN":
                        System.out.println("发送 服务未知异常 的通知！");
                        break;
                    default:
                        break;
                }
            }
        });
    }
}
```

 