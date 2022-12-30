---
autoGroup-1:   架构
---

# 配置中心

## 基本介绍

- 什么是配置中心

在微服务架构中，当系统从一个单体应用，被拆分成分布式系统上一个个服务节点后，配置文件也必须跟着迁移（分割），这样配置就分散了，不仅如此，分散中还包含着冗余，如下图：

![config](https://www.twelvet.cn/assets/images/docs/8c1641ab-ca50-4c9c-830b-514017bea77d.png)

总得来说，配置中心就是一种统一管理各种应用配置的基础服务组件。

- 为什么要使用配置中心

配置中心将配置从各应用中剥离出来，对配置进行统一管理，应用自身不需要自己去管理配置。

- Nacos 配置中心

`Nacos`是阿里巴巴开源的一个更易于构建云原生应用的动态服务发现、配置管理和服务管理平台。

![config](https://www.twelvet.cn/assets/images/docs/ddbcaa8c-a83a-4f6d-bb6d-e9f661b7f241.png)

配置中心的服务流程如下：

1、用户在配置中心更新配置信息。
 2、服务A和服务B及时得到配置更新通知，从配置中心获取配置。

## 下载方式

[参考下载方式](nacos.html#下载方式)

## 如何使用

1、添加依赖

```xml
<!-- springcloud alibaba nacos config -->
<dependency>
	<groupId>com.alibaba.cloud</groupId>
	<artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>

<!-- SpringBoot Web -->
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

2、在`bootstrap.yml`添加Nacos配置

```yml
# Spring
spring: 
  application:
    # 应用名称
    name: twelvet-xxxx
  profiles:
    # 环境配置
    active: dev
  cloud:
    nacos:
      config:
        # 配置中心地址
        server-addr: 127.0.0.1:8848
        # 配置文件格式
        file-extension: yml
        # 共享配置
        shared-configs:
          - application-${spring.profiles.active}.${spring.cloud.nacos.config.file-extension}
```

配置文件加载的优先级（由高到低）
 `bootstrap.properties ->bootstrap.yml -> application.properties -> application.yml`

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

4、给配置中心默认添加一个数据集 （Data Id）

![config](https://www.twelvet.cn/assets/images/docs/83112dc4-5f8f-4a96-81b0-c901f4861322.png)

```yml
# 测试属性
twelvet:
  # 名称
  name: twelvet
  # 版本
  version: 1.0.0
```

在Nacos Spring Cloud 中，数据集(Data Id) 的配置完整格式如下：
 `${spring.cloud.nacos.config.prefix}-${spring.profiles.active}.${spring.cloud.nacos.config.file-extension}`通俗一点就是前缀-环境-扩展名

5、编写测试类在`Controller`类中通过`@Value`注解获取配置值。

```java
package com.twelvet.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController
{
    @Value("${twelvet.name}")
    private String name;

    @Value("${twelvet.version}")
    private String version;

    @GetMapping("info")
    public String get()
    {
        return name + version;
    }
}
```

访问`http://localhost:9999/info`，返回正确数据表示测试通过。

## 动态刷新

通常会在`Controller`里边用`@Value`取出使用，但是你要是想改变他，就要重新改代码，打包，部署，十分麻烦，我们需要让配置文件的值变得动起来，`Nacos`也采用了`Spring Cloud`原生注解`@RefreshScope`实现配置自动更新。

```java
@RefreshScope //动态刷新配置
public class TestController 
{
    @Value("${twelvet.name}")
    private String name;

    @Value("${twelvet.version}")
    private String version;
	
    ....
}
```

## mysql支持

在单机模式时`nacos`使用嵌入式数据库实现数据的存储，不方便观察数据存储的基本情况。我们可以配置`mysql`数据库，可视化的查看数据的存储。

1、安装数据库，版本要求：5.6.5+
 2、使用`sql/twelvet_nacos`文件初始化`nacos`数据库
 3、修改`conf/application.properties`文件增加`mysql`支持

```properties
# db mysql
spring.datasource.platform=mysql
db.num=1
db.url.0=jdbc:mysql://localhost:3306/nacos?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=UTC
db.user=root
db.password=password
```

这个`application.properties`指`nacos`的解压目录`nacos/conf`目录下的文件

## 集群部署

集群模式适用于生产环境需要依赖`mysql`，单机可不必，三个及以上`Nacos`节点才能构成集群。

1、在`nacos`的解压目录`nacos/conf`目录下，修改配置文件`cluster.conf`

```sh
192.168.100.101:8848
192.168.100.102:8848
192.168.100.103:8848
```

2、修改`bootstrap.yml`中的`server-addr`属性，添加对应集群地址。

```properties
server-addr: 192.168.100.101:8848,192.168.100.102:8848,192.168.100.103:8848
```

3、启动运行成功后显示如图表示成功。 ![nacos](https://www.twelvet.cn/assets/images/docs/f1c3a6ad-b871-447f-bded-0241264183f6.png)

## 控制台使用

### 服务管理

开发者或者运维人员往往需要在服务注册后，通过友好的界面来查看服务的注册情况，包括当前系统注册的所有服务和每个服务的详情。并在有权限控制的情况下，进行服务的一些配置的编辑操作。`Nacos`在这个版本开放的控制台的服务发现部分，主要就是提供用户一个基本的运维页面，能够查看、编辑当前注册的服务。

**服务列表管理**

服务列表帮助用户以统一的视图管理其所有的微服务以及服务健康状态。

![nacos](https://www.twelvet.cn/assets/images/docs/0f7e6a15-02c0-4297-a54e-8cbb31af75a2.png)

在服务列表页面点击详情，可以看到服务的详情。可以查看服务、集群和实例的基本信息。

**服务流量权重支持及流量保护**

`Nacos`为用户提供了流量权重控制的能力，同时开放了服务流量的阈值保护，以帮助用户更好的保护服务服务提供者集群不被意外打垮。如下图所以，可以点击实例的编辑按钮，修改实例的权重。如果想增加实例的流量，可以将权重调大，如果不想实例接收流量，则可以将权重设为0。

![nacos](https://www.twelvet.cn/assets/images/docs/e7e40183-94d1-485b-aed4-4fa7792b2f81.png)

**服务元数据管理**

Nacos提供多个维度的服务元数据的暴露，帮助用户存储自定义的信息。这些信息都是以K-V的数据结构存储，在控制台上，会以`{"version":"1.0","env":"prod"}`这样的格式展示。类似的，编辑元数据可以通过相同的格式进行。例如服务的元数据编辑，首先点击服务详情页右上角的“编辑服务”按钮，然后在元数据输入框输入：`{"version":"1.0","env":"prod"}`。

![nacos](https://www.twelvet.cn/assets/images/docs/d4bd4777-0a6a-47a3-bc34-c3dc23730473.png)

点击确认，就可以在服务详情页面，看到服务的元数据已经更新了。

![nacos](https://www.twelvet.cn/assets/images/docs/390ff37d-d8d1-4274-8a0d-2ce2939caac5.png)

**服务优雅上下线**

Nacos还提供服务实例的上下线操作，在服务详情页面，可以点击实例的“上线”或者“下线”按钮，被下线的实例，将不会包含在健康的实例列表里。

![nacos](https://www.twelvet.cn/assets/images/docs/6f32de17-d422-4335-85df-a44bbfa01e67.png)

### 配置管理

Nacos支持基于Namespace和Group的配置分组管理，以便用户更灵活的根据自己的需要按照环境或者应用、模块等分组管理微服务以及Spring的大量配置，在配置管理中主要提供了配置历史版本、回滚、订阅者查询等核心管理能力。

![nacos](https://www.twelvet.cn/assets/images/docs/b4c26027-f372-49aa-bd9c-e534e17e67db.png)

**配置的版本及一键回滚**

`Nacos`通过提供配置版本管理及其一键回滚能力，帮助用户改错配置的时候能够快速恢复，降低微服务系统在配置管理上的一定会遇到的可用性风险。 ![nacos](https://www.twelvet.cn/assets/images/docs/4c97c4f7-306b-43c9-8a64-bdbe13c4769a.png)

**命名空间管理**

`Nacos`基于`Namespace`帮助用户逻辑隔离多个命名空间，这可以帮助用户更好的管理测试、预发、生产等多环境服务和配置，让每个环境的同一个配置（如数据库数据源）可以定义不同的值。

![nacos](https://www.twelvet.cn/assets/images/docs/7fbb6c51-4e04-4492-9c73-31dac1f99862.png)

### 修改默认密码

修改用户名和密码，将`nacos`中的`user`表`username`替换成你需要的登录账户，`password`改成你需要的密码，密码运行即可得到加密有算法。注意盐值是随机的，所以生成密码每次可能不一样，请不要担心。

```java
public static void main(String[] args)
{
	System.out.println(new BCryptPasswordEncoder().encode("twelvet"));
}
```

### 会话时间

默认会话保持时间为30分钟。30分钟后需要重新登录认证。 暂时不支持修改该默认时间。