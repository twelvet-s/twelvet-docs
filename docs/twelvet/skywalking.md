---
autoGroup-1:   架构
---

# 链路追踪

## 基本介绍

- 什么是链路追踪

随着微服务分布式系统变得日趋复杂，越来越多的组件开始走向分布式化，如分布式服务、分布式数据库、分布式缓存等，使得后台服务构成了一种复杂的分布式网络。在服务能力提升的同时，复杂的网络结构也使问题定位更加困难。在一个请求在经过诸多服务过程中，出现了某一个调用失败的情况，查询具体的异常由哪一个服务引起的就变得十分抓狂，问题定位和处理效率是也会非常低。

分布式链路追踪就是将一次分布式请求还原成调用链路，将一次分布式请求的调用情况集中展示，比如各个服务节点上的耗时、请求具体到达哪台机器上、每个服务节点的请求状态等等。

- 为什么要使用链路追踪

链路追踪为分布式应用的开发者提供了完整的调用链路还原、调用请求量统计、链路拓扑、应用依赖分析等工具，可以帮助开发者快速分析和诊断分布式应用架构下的性能瓶颈，提高微服务时代下的开发诊断效率。

- skywalking 链路追踪

`SkyWalking`是一个可观测性分析平台（Observability Analysis Platform 简称OAP）和应用性能管理系统（Application Performance Management 简称 APM）。

提供分布式链路追踪，服务网格（Service Mesh）遥测分析，度量（Metric）聚合和可视化一体化解决方案。

SkyWalking 特点

- 多语言自动探针，java，.Net Code ,Node.Js
- 多监控手段，语言探针和Service Mesh
- 轻量高效，不需要额外搭建大数据平台
- 模块化架构，UI ，存储《集群管理多种机制可选
- 支持警告
- 优秀的可视化效果。

下面是`SkyWalking`的架构图： ![skywalking](https://oscimg.oschina.net/oscnet/up-551a741ebdd3614f06408cc23dc302ef576.png)

## 下载方式

- Windows平台安装包下载

可以从`http://skywalking.apache.org/downloads`下载`apache-skywalking-apm-$version.tar.gz`包。

Windows下载解压后（.tar.gz），直接点击`bin/startup.bat`就可以了，这个时候实际上是启动了两个项目，一个收集器，一个web页面。

![skywalking](https://oscimg.oschina.net/oscnet/up-9a74069dbd42e28e47a94840d8db7475652.png)

提示

如果觉得官网下载慢，可以使用我分享的网盘地址: https://pan.baidu.com/s/1E9J52g6uW_VFWY34fHL6zA 提取码: vneh

- 打开控制台

`skywalking`提供了一个可视化的监控平台，安装好之后，在浏览器中输入([http://localhost:8080 (opens new window)](http://localhost:8080))就可以访问了。（我使用的是8.3.0版本）

![skywalking](https://oscimg.oschina.net/oscnet/up-8c56e9280dbd69e3db1508fa27af7fa704a.png)

## 如何使用

- 配置vm参数

`idea`配置`vm`参数图：

![idea skywalking](https://oscimg.oschina.net/oscnet/up-28824574c3bb227dfc487aa82fa60852656.png)

`eclipse`配置`vm`参数图：

![eclipse skywalking](https://oscimg.oschina.net/oscnet/up-ea035ca46c210197746804c59fad4ef403b.png)

```text
-javaagent:D:\apache-skywalking-apm-bin\agent\skywalking-agent.jar
-Dskywalking.agent.service_name=twelvet-gateway
-Dskywalking.collector.backend_service=localhost:11800
```

启动项目，访问接口，再去([http://localhost:8080 (opens new window)](http://localhost:8080))看面板数据

![skywalking](https://oscimg.oschina.net/oscnet/up-c3d59e9788dc7fbc34a9dd9235ad7856ad4.png)

| 参数         | 描述                           |
| ------------ | ------------------------------ |
| javaagent    | 配置skywalking-agent.jar的地址 |
| service_name | 配置需要监控的服务名           |
| javaagent    | skywalking收集器服务的地址     |

## 链路跟踪

当我们访问一个服务，而他会调用另一个服务的时候，点击拓扑图会出现下图的效果，这就是链路跟踪的效果

![skywalking](https://oscimg.oschina.net/oscnet/up-fc658837ebe738ba9d470f1f2b4c0de4231.png)

## 追踪调用链

在追踪界面，可以查看整个请求的具体调用链

![skywalking](https://oscimg.oschina.net/oscnet/up-a36efa6463829a3ebbc4cc4efacb6eb57e3.png)

 