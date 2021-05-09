---
autoGroup-1:  架构
---

# 注册中心

## 基本介绍

- 什么是注册中心

注册中心在微服务项目中扮演着非常重要的角色，是微服务架构中的纽带，类似于`通讯录`，它记录了服务和服务地址的映射关系。在分布式架构中，服务会注册到这里，当服务需要调用其它服务时，就到这里找到服务的地址，进行调用。

- 为什么要使用注册中心

注册中心解决了`服务发现`的问题。在没有注册中心时候，服务间调用需要知道被调方的地址或者代理地址。当服务更换部署地址，就不得不修改调用当中指定的地址或者修改代理配置。而有了注册中心之后，每个服务在调用别人的时候只需要知道服务名称就好，继续地址都会通过注册中心同步过来。

- Nacos 注册中心

`Nacos`是阿里巴巴开源的一个更易于构建云原生应用的动态服务发现、配置管理和服务管理平台。

![nacos](https://oscimg.oschina.net/oscnet/up-3b2499cb4616a7073db056095ff530c03c9.png)

## 下载方式

- 源码下载

```bash
$ git clone https://github.com/alibaba/nacos.git
$ cd nacos/
$ mvn -Prelease-nacos -Dmaven.test.skip=true clean install -U  
$ ls -al distribution/target/

// change the $version to your actual path
$ cd distribution/target/nacos-server-$version/nacos/bin
```

- 安装包下载

可以从`https://github.com/alibaba/nacos/releases`下载`nacos-server-$version.zip`包。

Windows下载解压后（.zip），直接点击`bin/startup.cmd -m standalone`就可以了。

Nacos默认是`集群模式cluster`，可以`startup.cmd`属性`MODE`为`单机模式standalone`

```text
set MODE="standalone"
```

![nacos](https://oscimg.oschina.net/oscnet/up-f0bee7ddd852b3c78f6f175469defe0a46b.png)

::: tip 提示

如果觉得官网下载慢，可以使用GitHub镜像。

:::

- 打开控制台

`Nacos`提供了一个可视化的操作平台，安装好之后，在浏览器中输入([http://localhost:8848/nacos (opens new window)](http://localhost:8848/nacos))就可以访问了，默认的用户名和密码都是`nacos`（我使用的是1.4.1版本）

![nacos](https://oscimg.oschina.net/oscnet/up-9a6ee9156ed87e5f8856892938f45bd4ace.png)

## 如何使用

1、添加依赖

```xml
<!-- springcloud alibaba nacos discovery -->
<dependency>
	<groupId>com.alibaba.cloud</groupId>
	<artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>

<!-- SpringBoot Web -->
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

2、添加Nacos配置

```yml
# Spring
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

3、在`Application`启动类加入注解`@SpringBootApplication`。

```java
@SpringBootApplication
public class TWTXxxxApplication
{
    public static void main(String[] args)
    {
        SpringApplication.run(TWTXxxxApplication.class, args);
    }
}
```

4、启动服务，查看`Nacos`控制台的服务列表

![nacos](https://oscimg.oschina.net/oscnet/up-4ed73db8d4582d4f0fc6bcc1ba38f6e6054.png)

## 测试验证

通过注册中心服务调用系统服务查询用户信息接口

```java
package com.twelvet.test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
public class TestController
{
    @Autowired
    private RestTemplate restTemplate;

    // 新增restTemplate对象注入方法，注意，此处LoadBalanced注解一定要加上，否则无法远程调用
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate()
    {
        return new RestTemplate();
    }

    @GetMapping("user")
    public String get()
    {
        return restTemplate.getForObject("http://twelvet-system/user/info/admin", String.class);
    }
}
```

访问`http://localhost:8888/user/admin`，返回用户数据成功表示测试通过。