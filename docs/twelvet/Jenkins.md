---
autoGroup-1:   架构
---

# Jenkins

## 什么是jenkins

Jenkins是一个开源的、提供友好操作界面的持续集成（CI）工具，起源于Hudson（Hudson是商用的），主要用于持续、自动的构建/测试软件项目、监控外部任务的运行（这个比较抽象，暂且写上，不做解释）。Jenkins用Java语言编写，可在Tomcat等流行的servlet容器中运行，也可独立运行。

 　　通常与版本管理工具（SCM）、构建工具结合使用；常用的版本控制工具有SVN、GIT，构建工具有Maven、Ant、Gradle。

## Jenkins特性

 　　**易于安装**

 　　不需要安装、不需要数据库，只需通过java -jar jenkins.war或部署到一个servlet容器中

 　　**易于配置**

 　　所有的配置都可能通过jenkins提供的web界面完成，当然如果你喜欢，也可以通过手动修改xml文件进行配置

 　　生成JUnit或TestNG的测试报告

 　　**文件识别**

 　　jenkins能跟踪每次构建生成哪些jar包以及使用哪个版本的jar包

 　　分布式构建

 　　**插件支持**

 　　jenkins可以通过第三方插件扩展，也可以根据团队需要开发插件

 　　Jenkins中的任务（Job）和构建（build）

 　　任务（Job）是Jenkins的一个执行计划，是一系列操作的集合，构建是Jenkins的任务的一次运行。

## 安装与启动

**环境 centos7**

```shell
wget -O /etc/yum.repos.d/jenkins.repo http://pkg.jenkins-ci.org/redhat/jenkins.repo

rpm --import https://jenkins-ci.org/redhat/jenkins-ci.org.key

yum install -y jenkins

service jenkins start
```

