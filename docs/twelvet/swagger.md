---
autoGroup-1:   架构
---

# 系统接口

## 基本介绍

[参考系统接口实现](javaDescription.html#swagger接口文档)

## 如何使用

1、添加依赖

```xml
<!-- SpringBoot Web -->
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- Swagger -->
<dependency>
	<groupId>io.springfox</groupId>
	<artifactId>springfox-swagger2</artifactId>
	<version>${swagger.fox.version}</version>
</dependency>

<!-- Swagger UI -->
<dependency>
	<groupId>io.springfox</groupId>
	<artifactId>springfox-swagger-ui</artifactId>
	<version>${swagger.fox.version}</version>
</dependency>
```

2、在`application.yml`添加服务配置

```yml
server:
  port: 6666

spring:
  application:
    name: twelvet-xxxx
```

3、在`Application`启动类加入注解`@SpringBootApplication`。

```java
@EnableSwagger2
@SpringBootApplication
public class TWTSwaggerApplication
{
    public static void main(String[] args)
    {
        SpringApplication.run(TWTSwaggerApplication.class, args);
    }
}
```

4、添加`TestUserController.java`，模拟接口返回用户信息。

```java
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestUserController
{
    @GetMapping("/user/info")
    public Object info()
    {
        return "{\"username\":\"admin\",\"password\":\"admin123\"}";
    }
}
```

5、访问`http://localhost:6666/swagger-ui.html`，测试验证接口返回正确数据表示测试通过。

## 接口模块

项目中存在`twelvet-framework-swagger`模块，可以直接依赖后使用。

1、业务模块添加依赖

```xml
<!-- twelvet common swagger -->
<dependency>
	<groupId>com.twelvet</groupId>
	<artifactId>twelvet-framework-swagger</artifactId>
</dependency>
```

2、在`twelvet-xxxx-dev.yml`添加swagger配置

```yml
# swagger配置
swagger:
  title: 系统模块接口文档
  license: Powered By twelvet
  licenseUrl: https://twelvet.cn
```

3、在`Application`启动类加入系统接口注解`@EnableCustomSwagger2`

```java
@EnableCustomConfig
@EnableCustomSwagger2
@EnableRyFeignClients
@SpringCloudApplication
public class TWTSystemApplication
{
    public static void main(String[] args)
    {
        SpringApplication.run(TWTSystemApplication.class, args);
    }
}
```

4、测试验证

访问`http://{ip}:{port}/swagger-ui.html`地址，出现如下图表示成功。

![swagger](https://oscimg.oschina.net/oscnet/up-24a0d329ed368fa86c6da597ed158898e4f.png)

## 接口聚合

访问`swagger-ui.html`的时候会发现右上角的`Select a spec`这个下拉选项

![swagger](https://oscimg.oschina.net/oscnet/up-9d740e616ac8523c9d8285ce553689ca20b.png)

当启动一个`springboot`项目的时候会发现这个下拉选项毫无用处，不过它的强大是在于这个下拉可以用来切换不同项目的`swagger`接口地址，这就实现了使用一个网关的`url`访问所有的项目接口。

1、网关模块添加依赖

```xml
<!-- SpringCloud Gateway -->
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>

<!-- SpringCloud Alibaba Nacos -->
<dependency>
	<groupId>com.alibaba.cloud</groupId>
	<artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
		
<!-- Swagger UI -->
<dependency>
	<groupId>io.springfox</groupId>
	<artifactId>springfox-swagger-ui</artifactId>
	<version>${swagger.fox.version}</version>
</dependency>

<!-- Swagger -->
<dependency>
	<groupId>io.springfox</groupId>
	<artifactId>springfox-swagger2</artifactId>
	<version>${swagger.fox.version}</version>
</dependency>
```

2、网关服务创建一个类`SwaggerProvider.java`实现`SwaggerResourcesProvider`

```java
package com.twelvet.gateway.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.config.GatewayProperties;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.support.NameUtils;
import org.springframework.stereotype.Component;
import springfox.documentation.swagger.web.SwaggerResource;
import springfox.documentation.swagger.web.SwaggerResourcesProvider;

/**
 * 聚合系统接口
 * 
 * @author twelvet
 */
@Component
public class SwaggerProvider implements SwaggerResourcesProvider
{
    /**
     * Swagger2默认的url后缀
     */
    public static final String SWAGGER2URL = "/v2/api-docs";
    /**
     * 网关路由
     */
    @Autowired
    private RouteLocator routeLocator;

    @Autowired
    private GatewayProperties gatewayProperties;

    /**
     * 聚合其他服务接口
     * 
     * @return
     */
    @Override
    public List<SwaggerResource> get()
    {
        List<SwaggerResource> resourceList = new ArrayList<>();
        List<String> routes = new ArrayList<>();
        // 获取网关中配置的route
        routeLocator.getRoutes().subscribe(route -> routes.add(route.getId()));
        gatewayProperties.getRoutes().stream()
                .filter(routeDefinition -> routes
                        .contains(routeDefinition.getId()))
                .forEach(routeDefinition -> routeDefinition.getPredicates().stream()
                        .filter(predicateDefinition -> "Path".equalsIgnoreCase(predicateDefinition.getName()))
                        .filter(predicateDefinition -> !"twelvet-auth".equalsIgnoreCase(routeDefinition.getId()))
                        .forEach(predicateDefinition -> resourceList
                                .add(swaggerResource(routeDefinition.getId(), predicateDefinition.getArgs()
                                        .get(NameUtils.GENERATED_NAME_PREFIX + "0").replace("/**", SWAGGER2URL)))));
        return resourceList;
    }

    private SwaggerResource swaggerResource(String name, String location)
    {
        SwaggerResource swaggerResource = new SwaggerResource();
        swaggerResource.setName(name);
        swaggerResource.setLocation(location);
        swaggerResource.setSwaggerVersion("2.0");
        return swaggerResource;
    }
}
```

3、创建一个聚合接口类`SwaggerHandler.java`

```java
package com.twelvet.gateway.handler;

import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import springfox.documentation.swagger.web.SecurityConfiguration;
import springfox.documentation.swagger.web.SecurityConfigurationBuilder;
import springfox.documentation.swagger.web.SwaggerResourcesProvider;
import springfox.documentation.swagger.web.UiConfiguration;
import springfox.documentation.swagger.web.UiConfigurationBuilder;

@RestController
@RequestMapping("/swagger-resources")
public class SwaggerHandler
{
    @Autowired(required = false)
    private SecurityConfiguration securityConfiguration;

    @Autowired(required = false)
    private UiConfiguration uiConfiguration;

    private final SwaggerResourcesProvider swaggerResources;

    @Autowired
    public SwaggerHandler(SwaggerResourcesProvider swaggerResources)
    {
        this.swaggerResources = swaggerResources;
    }

    @GetMapping("/configuration/security")
    public Mono<ResponseEntity<SecurityConfiguration>> securityConfiguration()
    {
        return Mono.just(new ResponseEntity<>(
                Optional.ofNullable(securityConfiguration).orElse(SecurityConfigurationBuilder.builder().build()),
                HttpStatus.OK));
    }

    @GetMapping("/configuration/ui")
    public Mono<ResponseEntity<UiConfiguration>> uiConfiguration()
    {
        return Mono.just(new ResponseEntity<>(
                Optional.ofNullable(uiConfiguration).orElse(UiConfigurationBuilder.builder().build()), HttpStatus.OK));
    }

    @SuppressWarnings("rawtypes")
    @GetMapping("")
    public Mono<ResponseEntity> swaggerResources()
    {
        return Mono.just((new ResponseEntity<>(swaggerResources.get(), HttpStatus.OK)));
    }
}
```

4、配置注册中心及路由信息

```yml
spring:
  application:
    name: twelvet-swagger-test
  cloud:
    nacos:
      discovery:
        # 服务注册地址
        server-addr: 127.0.0.1:8848
    gateway:
      routes:
        # 认证中心
        - id: twelvet-auth
          uri: lb://twelvet-auth
          predicates:
            - Path=/auth/**
          filters:
            - StripPrefix=1
        # 系统模块
        - id: twelvet-system
          uri: lb://twelvet-system
          predicates:
            - Path=/system/**
          filters:
            - StripPrefix=1
        # 代码生成
        - id: twelvet-gen
          uri: lb://twelvet-gen
          predicates:
            - Path=/code/**
          filters:
            - StripPrefix=1
        # 定时任务
        - id: twelvet-job
          uri: lb://twelvet-job
          predicates:
            - Path=/schedule/**
          filters:
            - StripPrefix=1
        # 文件服务
        - id: twelvet-file
          uri: lb://twelvet-file
          predicates:
            - Path=/file/**
          filters:
            - StripPrefix=1
```

5、测试验证

打开浏览器，输入：([http://localhost:88/swagger-ui.html (opens new window)](http://localhost:88/swagger-ui.html))

![swagger](https://oscimg.oschina.net/oscnet/up-7455b9e8a7850faebf31f2a869412e2132d.png)

选择切换不同服务的`swagger`接口

## 全局授权

在测试系统接口中可能存在一些接口用到用户信息或权限验证，此时需要添加全局的`token`参数。如图

![swagger](https://oscimg.oschina.net/oscnet/up-a474910efef3e0739b42f3d5cc329f8ef66.png)

`token`是在登录成功后返回的，可以在浏览器通过F12查看`Network`中的请求地址，对应参数`Authorization`。复制截图内容到`swagger`全局`Authorization`属性`value`参数中，点击`Authorize`，以后每次访问接口会携带此`token`信息。

![swagger](https://oscimg.oschina.net/oscnet/up-4f771cfc906fa9dcc173f20fae80c7f5191.png)

## 整合knife4j

1、在`Spring Cloud`的微服务架构下，每个微服务并不需要引入前端的Ui资源，因此在每个微服务的`Spring Boot`项目下，引入`knife4j`提供的微服务`starter`。

```xml
<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-spring-boot-starter</artifactId>
    <version>2.0.8</version>
</dependency>
```

2、在网关聚合文档服务下，把前端的`ui`资源引入

```xml
<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-micro-spring-boot-starter</artifactId>
    <version>2.0.8</version>
</dependency>
```

3、测试验证

访问`http://{ip}:{port}/doc.html`地址，出现如下图表示成功。

![knife4j](https://oscimg.oschina.net/oscnet/up-860f80bd38f5998dfc319b2514cf1bae169.png)

 