# 环境部署

## 准备工作

```text
JDK >= 1.8 (推荐1.8版本)
Mysql >= 5.7.0 (推荐5.7版本)
Redis >= 3.0
Maven >= 3.0
Node >= 10
nacos >= 1.1.0
sentinel >= 1.6.0
```

## 运行系统

### 后端运行

1、前往`GitHub`下载页面[https://github.com/twelvet-s/twelvet](https://github.com/twelvet-s/twelvet)下载解压到工作目录

2、导入到`Idea`，此处省略。

3、创建数据库`twelvet`并导入数据脚本`twelvet.sql`<font color='red'>（必须）</font>

4、创建数据库`twelvet_job`并导入`twelvet_job.sql`（可选）

4、创建数据库`nacos`并导入数据脚本`twelvet_nacos.sql`<font color='red'>（必须）</font>

5、配置`nacos`持久化，修改`conf/application.properties`文件，增加支持`mysql`数据源配置

```yml
# db mysql
spring.datasource.platform=mysql
db.num=1
db.url.0=jdbc:mysql://localhost:3306/twelvet-config?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=UTC
db.user=root
db.password=password
```

提示

配置文件`application.properties`是在下载的`nacos-server`包`conf`目录下。

默认配置单机模式<font color='red'>（注意更改启动参数为set MODE="standalone"）</font>，`nacos`集群/多集群部署模式参考 ([Nacos支持三种部署模式 (opens new window)](https://nacos.io/zh-cn/docs/deployment.html))

6、打开运行基础模块（启动没有先后顺序）

- TWTGatewayApp （网关模块 <font color='red'>必须</font>）
- TWTAuthApp    （认证模块 <font color='red'>必须</font>）
- TWTSystemApp  （系统模块 <font color='red'>必须</font>）
- TWTMonitorApp （监控中心 可选）
- TWTGenApp     （代码生成 可选）
- TWTJobApp     （定时任务 可选）
- TWTFileApp     （文件服务 可选）

7、集成`seata`分布式事务（可选配置，默认不启用）

创建数据库`twelvet-seata`并导入数据脚本`twelvet-seata.sql`

[参考集成nacos配置中心(等待更新)](https://www.twelvet.cn/docs/twelvet/deploy.html#运行系统)

提示

运行前需要先启动`nacos`，运行成功可以通过([http://localhost:88](http://localhost:88))访问API

继续参考下面步骤部署`twelvet-ui`前端，然后通过前端地址来访问。

### 前端运行

```bash
# 进入项目目录
cd twelvet-ui

# 安装依赖
npm install

# 强烈建议不要用直接使用 cnpm 安装，会有各种诡异的 bug，可以通过重新指定 registry 来解决 npm 安装速度慢的问题。
npm install --registry=https://registry.npm.taobao.org

# 本地开发 启动项目
npm start
```

4、打开浏览器，输入：([http://localhost:8000](http://localhost:8000)) 默认账户/密码 `admin/123456）
 若能正确展示登录页面，并能成功登录，菜单及页面展示正常，则表明环境搭建成功

建议使用`Git`克隆，因为克隆的方式可以和TwelveT随时保持更新同步。使用`Git`命令克隆

```text
git clone https://github.com/twelvet-s/twelvet
```

提示

因为本项目是前后端完全分离的，所以需要前后端都单独启动好，才能进行访问。

前端安装完Node后，最好设置下淘宝的镜像源，不建议使用cnpm（可能会出现奇怪的问题）

## 部署系统

提示

<font color='red'>因为本项目是前后端分离的，所以需要前后端都部署好，才能进行访问</font>

### 后端部署

- 打包工程文件

在`twelvet`项目的`main`目录下执行`mvn clean && mvn install`

提示

不同模块版本会生成在`twelvet/twelvet-xxxx`模块下`target`文件夹

- 部署工程文件

1、jar部署方式
 使用命令行执行：`java –jar twelvet-xxxx.jar` 

2、docker部署方式<font color='red'>(请等待完善docker-compose)</font>

  ```bash
  mv twelvet-xxx/target/twelvet-xxx-version-xxx.jar ../twelvet-xxx.jar
  docker build -t twelvet-xxx.jar .
  docker run -d --name twelvet-xxx --network host twelvet-xxx.jar
  ```



### 前端部署

当项目开发完毕，只需要运行一行命令就可以打包你的应用

```bash
# 打包正式环境
yarn build:prod

# 打包预发布环境
yarn build:stage
```

构建打包成功之后，会在根目录生成 `dist` 文件夹，里面就是构建打包好的文件，通常是 `***.js` 、`***.css`、`index.html` 等静态文件。

通常情况下 `dist` 文件夹的静态文件发布到你的 nginx 或者静态服务器即可，其中的 `index.html` 是后台服务的入口页面。

详细的nginx配置请查看[官方文档](https://pro.ant.design/docs/deploy-cn#%E9%83%A8%E7%BD%B2%E5%88%B0%E4%B8%8D%E5%90%8C%E7%9A%84%E5%B9%B3%E5%8F%B0)

## 常见问题

1. 如果使用`Mac`需要修改`nacos`配置`twelvet-file-dev.yml`文件路径`path`
2. 如果使用`Linux` 提示表不存在，设置大小写敏感配置在`/etc/my.cnf`添加`lower_case_table_names=1`，重启MYSQL服务
3. 如果提示当前权限不足，无法写入文件请检查`twelvet-file-dev.yml`中的`path`路径或`logback.xml`中的`log.path`路径是否有可读可写操作权限

如遇到无法解决的问题请到[https://github.com/twelvet-s/twelvet/issues](https://github.com/twelvet-s/twelvet/issues)反馈，会不定时进行解答。