---
title: 介绍
order: 1
---

# TwelveT - 微服务
<p align='center'>
<a href="https://www.twelvet.cn/" target='_blank'>
<img src="https://img.shields.io/github/license/mashape/apistatus.svg">
</a>
<a href="https://github.com/twelvet-s/twelvet" target='_blank'>
<img src="https://img.shields.io/badge/Author-TwelveT-orange.svg">
</a>
<a href="https://www.twelvet.cn/" target='_blank'>
<img src="https://img.shields.io/badge/twelvet-v1.0.0-brightgreen.svg">
</a>
</p>

::: tip
一款基于Spring Cloud Alibaba的权限管理系统，集成市面上流行库，可以作用为快速开发的一个框架使用
:::

一套以微服务架构的脚手架,使用Spring Boot Alibaba系列进行架构,学习并了解它将能快速掌握微服务核心基础。 此项目是为了减少业务代码的重复轮子,它具有一个系统该有的通用性核心业务代码,无论是微服务还是单体,都是通用的业务
但更多的,是为了学习微服务的理念以及开发 您可以使用它进行网站管理后台，网站会员中心，CMS，CRM，OA等待系统的开发,当然,不仅仅是一些小系统,我们可以生产更多的服务模块,不断完善项目！！！
微服务显然是一个庞然大物,本项目目前说仅一人在维护开发,精力十分有限。所以并不能保证绝对的功能性，但，也希望通过日后的维护不断地完善出来！！！

**系统模块**

~~~
com.twelvet     
├── twelvet-ui              // 前端框架 [80]
├── twelvet-gateway         // 网关模块 [88]
├── twelvet-auth            // 认证中心 [8888]
├── twelvet-api             // 接口模块
│       └── twelvet-api-system                          // 系统接口
│       └── twelvet-api-dfs                             // DFS接口
│       └── twelvet-api-job                             // 定时任务接口
├── twelvet-framework          // 核心模块
│       └── twelvet-framework-core                         // 核心模块
│       └── twelvet-framework-log                          // 日志记录
│       └── twelvet-framework-redis                        // 缓存服务
│       └── twelvet-framework-security                     // 安全模块
│       └── twelvet-framework-utils                        // 工具模块
├── twelvet-server         // 业务模块
│       └── twelvet-server-system                          // 系统模块 [8081]
│       └── twelvet-server-job                            // 定时任务 [8082]
│       └── twelvet-server-dfs                            //  DFS服务 [8083]
├── twelvet-visual          // 图形化管理模块
│       └── twelvet-visual-monitor                         // 监控中心 [8100]
├──pom.xml                // 公共依赖
~~~

**内置功能**

1. 用户管理：用户是系统操作者，该功能主要完成系统用户配置。
2. 部门管理：配置系统组织机构（公司、部门、小组），树结构展现支持数据权限。
3. 岗位管理：配置系统用户所属担任职务。
4. 菜单管理：配置系统菜单，操作权限，按钮权限标识等。
5. 角色管理：角色菜单权限分配、设置角色按机构进行数据范围权限划分。
6. 字典管理：对系统中经常使用的一些较为固定的数据进行维护。
7. 参数管理：对系统动态配置常用参数。
8. 操作日志：系统正常操作日志记录和查询；系统异常信息日志记录和查询。
9. 登录日志：系统登录日志记录查询包含登录异常。
10. 定时任务：在线（添加、修改、删除)任务调度包含执行结果日志。
11. 系统接口：根据业务代码自动生成相关的api接口文档。
12. 服务监控：监视当前系统CPU、内存、磁盘、堆栈等相关信息。
13. 连接池监视：监视当前系统数据库连接池状态，可进行分析SQL找出系统性能瓶颈。
14. 分布式文件储存。
15. Swagger网关聚合文档。

**演示图**

<table>
    <tr>
        <td><img src="https://www.twelvet.cn/assets/images/twelvet/1.png"/></td>
        <td><img src="https://www.twelvet.cn/assets/images/twelvet/2.png"/></td>
    </tr>
    <tr>
        <td><img src="https://www.twelvet.cn/assets/images/twelvet/3.png"/></td>
        <td><img src="https://www.twelvet.cn/assets/images/twelvet/4.png"/></td>
    </tr>
    <tr>
        <td><img src="https://www.twelvet.cn/assets/images/twelvet/5.png"/></td>
        <td><img src="https://www.twelvet.cn/assets/images/twelvet/6.png"/></td>
    </tr>
</table>

**在线体验**

- admin/123456

演示地址：[http://cloud.twelvet.cn](http://cloud.twelvet.cn)
