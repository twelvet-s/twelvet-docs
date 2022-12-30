---
autoGroup-1:   架构
---

# 分布式事务

数据库事务的基本概念（ACID）

**原子性**（Atomicity）：操作这些指令时，要么全部执行成功，要么全部不执行。只要其中一个指令执行失败，所有的指令都执行失败，数据进行回滚，回到执行指令前的数据状态。`要么执行，要么不执行`

**一致性**（Consistency）：事务的执行使数据从一个状态转换为另一个状态，数据库的完整性约束没有被破坏。`能量守恒，总量不变`

**隔离性**（Isolation）：隔离性是当多个用户并发访问数据库时，比如操作同一张表时，数据库为每一个用户开启的事务，不能被其他事务的操作所干扰，多个并发事务之间要相互隔离。信息彼此独立，互不干扰

**持久性**（Durability）：当事务正确完成后，它对于数据的改变是永久性的。不会轻易丢失

## 基本介绍

- 什么是分布式事务

指一次大的操作由不同的小操作组成的，这些小的操作分布在不同的服务器上，分布式事务需要保证这些小操作要么全部成功，要么全部失败。从本质上来说，分布式事务就是为了保证不同数据库的数据一致性。

- 为什么要使用分布式事务

在微服务独立数据源的思想，每一个微服务都有一个或者多个数据源，虽然单机单库事务已经非常成熟，但是由于网路延迟和不可靠的客观因素，分布式事务到现在也还没有成熟的方案，对于中大型网站，特别是涉及到交易的网站，一旦将服务拆分微服务，分布式事务一定是绕不开的一个组件，通常解决分布式事务问题。

- seata 分布式事务

`Seata`是阿里开源的一款开源的分布式事务解决方案，致力于提供高性能和简单易用的分布式事务服务。

`Seata`目标打造一站式的分布事务的解决方案，最终会提供四种事务模式：

**AT 模式**：参见([《Seata AT 模式》 (opens new window)](https://seata.io/zh-cn/docs/dev/mode/at-mode.html))文档
 **TCC 模式**：参见([《Seata TCC 模式》 (opens new window)](https://seata.io/zh-cn/docs/dev/mode/tcc-mode.html))文档
 **Saga 模式**：参见([《SEATA Saga 模式》 (opens new window)](https://seata.io/zh-cn/docs/dev/mode/saga-mode.html))文档
 **XA 模式**：正在开发中... 目前使用的流行度情况是：`AT` > `TCC` > `Saga`。因此，我们在学习`Seata`的时候，可以花更多精力在`AT`模式上，最好搞懂背后的实现原理，毕竟分布式事务涉及到数据的正确性，出问题需要快速排查定位并解决。

## 下载方式

- Windows平台安装包下载

可以从`https://github.com/seata/seata/releases`下载`seata-server-$version.zip`包。

Windows下载解压后（.zip），直接点击`bin/seata-server.bat`就可以了。（我使用的是1.4.0版本）

![seata](https://www.twelvet.cn/assets/images/docs/47de4e15-2729-4854-b257-3b0b0c177537.png)

::: tip 提示

如果觉得官网下载慢，可以使用我分享的网盘地址: https://pan.baidu.com/s/1E9J52g6uW_VFWY34fHL6zA 提取码: vneh

:::

## 如何使用

1、创建相关测试数据库和表。

```sql
# 订单数据库信息 seata_order
DROP DATABASE IF EXISTS seata_order;
CREATE DATABASE seata_order;

DROP TABLE IF EXISTS seata_order.p_order;
CREATE TABLE seata_order.p_order
(
    id               INT(11) NOT NULL AUTO_INCREMENT,
    user_id          INT(11) DEFAULT NULL,
    product_id       INT(11) DEFAULT NULL,
    amount           INT(11) DEFAULT NULL,
    total_price      DOUBLE       DEFAULT NULL,
    status           VARCHAR(100) DEFAULT NULL,
    add_time         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    last_update_time DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8mb4;

DROP TABLE IF EXISTS seata_order.undo_log;
CREATE TABLE seata_order.undo_log
(
    id            BIGINT(20) NOT NULL AUTO_INCREMENT,
    branch_id     BIGINT(20) NOT NULL,
    xid           VARCHAR(100) NOT NULL,
    context       VARCHAR(128) NOT NULL,
    rollback_info LONGBLOB     NOT NULL,
    log_status    INT(11) NOT NULL,
    log_created   DATETIME     NOT NULL,
    log_modified  DATETIME     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY ux_undo_log (xid, branch_id)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8mb4;
  
# 产品数据库信息 seata_product
DROP DATABASE IF EXISTS seata_product;
CREATE DATABASE seata_product;

DROP TABLE IF EXISTS seata_product.product;
CREATE TABLE seata_product.product
(
    id               INT(11) NOT NULL AUTO_INCREMENT,
    price            DOUBLE   DEFAULT NULL,
    stock            INT(11) DEFAULT NULL,
    last_update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8mb4;

DROP TABLE IF EXISTS seata_product.undo_log;
CREATE TABLE seata_product.undo_log
(
    id            BIGINT(20) NOT NULL AUTO_INCREMENT,
    branch_id     BIGINT(20) NOT NULL,
    xid           VARCHAR(100) NOT NULL,
    context       VARCHAR(128) NOT NULL,
    rollback_info LONGBLOB     NOT NULL,
    log_status    INT(11) NOT NULL,
    log_created   DATETIME     NOT NULL,
    log_modified  DATETIME     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY ux_undo_log (xid, branch_id)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8mb4;

INSERT INTO seata_product.product (id, price, stock)
VALUES (1, 10, 20);


# 账户数据库信息 seata_account
DROP DATABASE IF EXISTS seata_account;
CREATE DATABASE seata_account;

DROP TABLE IF EXISTS seata_account.account;
CREATE TABLE seata_account.account
(
    id               INT(11) NOT NULL AUTO_INCREMENT,
    balance          DOUBLE   DEFAULT NULL,
    last_update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8mb4;

DROP TABLE IF EXISTS seata_account.undo_log;
CREATE TABLE seata_account.undo_log
(
    id            BIGINT(20) NOT NULL AUTO_INCREMENT,
    branch_id     BIGINT(20) NOT NULL,
    xid           VARCHAR(100) NOT NULL,
    context       VARCHAR(128) NOT NULL,
    rollback_info LONGBLOB     NOT NULL,
    log_status    INT(11) NOT NULL,
    log_created   DATETIME     NOT NULL,
    log_modified  DATETIME     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY ux_undo_log (xid, branch_id)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8mb4;
INSERT INTO seata_account.account (id, balance)
VALUES (1, 50);
```

其中，每个库中的`undo_log`表，是`Seata AT`模式必须创建的表，主要用于分支事务的回滚。
 另外，考虑到测试方便，我们插入了一条`id = 1`的`account`记录，和一条`id = 1`的`product`记录。

2、引入`twelvet-framework-datasource`依赖（包含`seata`配置）

```xml
<!-- twelvet common datasource -->
<dependency>
	<groupId>com.twelvet</groupId>
	<artifactId>twelvet-framework-datasource</artifactId>
</dependency>
```

3、服务配置文件

```yml
# spring配置
spring: 
  redis:
    host: localhost
    port: 6379
    password: 
  datasource:
    druid:
      stat-view-servlet:
        enabled: true
        loginUsername: admin
        loginPassword: 123456
    dynamic:
      druid:
        initial-size: 5
        min-idle: 5
        maxActive: 20
        maxWait: 60000
        timeBetweenEvictionRunsMillis: 60000
        minEvictableIdleTimeMillis: 300000
        validationQuery: SELECT 1 FROM DUAL
        testWhileIdle: true
        testOnBorrow: false
        testOnReturn: false
        poolPreparedStatements: true
        maxPoolPreparedStatementPerConnectionSize: 20
        filters: stat,wall,slf4j
        connectionProperties: druid.stat.mergeSql\=true;druid.stat.slowSqlMillis\=5000
      datasource:
          # 主库数据源
          master:
            driver-class-name: com.mysql.cj.jdbc.Driver
            url: jdbc:mysql://localhost:3306/ry-cloud?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8
            username: root
            password: password
          # seata_order数据源
          order:
            username: root
            password: password
            url: jdbc:mysql://localhost:3306/seata_order?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8
            driver-class-name: com.mysql.cj.jdbc.Driver
          # seata_account数据源
          account:
            username: root
            password: password
            url: jdbc:mysql://localhost:3306/seata_account?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8
            driver-class-name: com.mysql.cj.jdbc.Driver
          # seata_product数据源
          product:
            username: root
            password: password
            url: jdbc:mysql://localhost:3306/seata_product?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8
            driver-class-name: com.mysql.cj.jdbc.Driver
      seata: true    #开启seata代理，开启后默认每个数据源都代理，如果某个不需要代理可单独关闭

# seata配置
seata:
  enabled: true
  # Seata 应用编号，默认为 ${spring.application.name}
  application-id: ${spring.application.name}
  # Seata 事务组编号，用于 TC 集群名
  tx-service-group: ${spring.application.name}-group
  # 关闭自动代理
  enable-auto-data-source-proxy: false
  # 服务配置项
  service:
    # 虚拟组和分组的映射
    vgroup-mapping:
      twelvet-system-group: default
    # 分组和 Seata 服务的映射
    grouplist:
      default: 127.0.0.1:8091
  config:
    type: file
  registry:
    type: file

# mybatis配置
mybatis:
    # 搜索指定包别名
    typeAliasesPackage: com.twelvet.system
    # 配置mapper的扫描，找到所有的mapper.xml映射文件
    mapperLocations: classpath:mapper/**/*.xml

# swagger配置
swagger:
  title: 系统模块接口文档
  license: Powered By twelvet
  licenseUrl: https://twelvet.cn
```

::: tip 提示

注意，一定要设置`spring.datasource.dynamic.seata`配置项为`true`，开启对`Seata`的集成，否则会导致`Seata`全局事务回滚失败。

:::

## 示例代码

### Domain

**Account.java**

```java
package com.twelvet.system.domain;

import java.util.Date;

public class Account
{
    private Long id;

    /**
     * 余额
     */
    private Double balance;

    private Date lastUpdateTime;

    public Long getId()
    {
        return id;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public Double getBalance()
    {
        return balance;
    }

    public void setBalance(Double balance)
    {
        this.balance = balance;
    }

    public Date getLastUpdateTime()
    {
        return lastUpdateTime;
    }

    public void setLastUpdateTime(Date lastUpdateTime)
    {
        this.lastUpdateTime = lastUpdateTime;
    }
}
```

**Order.java**

```java
package com.twelvet.system.domain;

public class Order
{
    private Integer id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 商品ID
     */
    private Long productId;

    /**
     * 订单状态
     */
    private int status;

    /**
     * 数量
     */
    private Integer amount;

    /**
     * 总金额
     */
    private Double totalPrice;

    public Order()
    {
    }

    public Order(Long userId, Long productId, int status, Integer amount)
    {
        this.userId = userId;
        this.productId = productId;
        this.status = status;
        this.amount = amount;
    }

    public Integer getId()
    {
        return id;
    }

    public void setId(Integer id)
    {
        this.id = id;
    }

    public Long getUserId()
    {
        return userId;
    }

    public void setUserId(Long userId)
    {
        this.userId = userId;
    }

    public Long getProductId()
    {
        return productId;
    }

    public void setProductId(Long productId)
    {
        this.productId = productId;
    }

    public int getStatus()
    {
        return status;
    }

    public void setStatus(int status)
    {
        this.status = status;
    }

    public Integer getAmount()
    {
        return amount;
    }

    public void setAmount(Integer amount)
    {
        this.amount = amount;
    }

    public Double getTotalPrice()
    {
        return totalPrice;
    }

    public void setTotalPrice(Double totalPrice)
    {
        this.totalPrice = totalPrice;
    }
}
```

**Product.java**

```java
package com.twelvet.system.domain;

import java.util.Date;

public class Product
{

    private Integer id;
    /**
     * 价格
     */
    private Double price;
    /**
     * 库存
     */
    private Integer stock;

    private Date lastUpdateTime;

    public Integer getId()
    {
        return id;
    }

    public void setId(Integer id)
    {
        this.id = id;
    }

    public Double getPrice()
    {
        return price;
    }

    public void setPrice(Double price)
    {
        this.price = price;
    }

    public Integer getStock()
    {
        return stock;
    }

    public void setStock(Integer stock)
    {
        this.stock = stock;
    }

    public Date getLastUpdateTime()
    {
        return lastUpdateTime;
    }

    public void setLastUpdateTime(Date lastUpdateTime)
    {
        this.lastUpdateTime = lastUpdateTime;
    }
}
```

### Dto

**PlaceOrderRequest.java**

```java
package com.twelvet.system.domain.dto;

public class PlaceOrderRequest
{
    private Long userId;

    private Long productId;

    private Integer amount;

    public PlaceOrderRequest()
    {
    }

    public PlaceOrderRequest(Long userId, Long productId, Integer amount)
    {
        this.userId = userId;
        this.productId = productId;
        this.amount = amount;
    }

    public Long getUserId()
    {
        return userId;
    }

    public void setUserId(Long userId)
    {
        this.userId = userId;
    }

    public Long getProductId()
    {
        return productId;
    }

    public void setProductId(Long productId)
    {
        this.productId = productId;
    }

    public Integer getAmount()
    {
        return amount;
    }

    public void setAmount(Integer amount)
    {
        this.amount = amount;
    }
}
```

**ReduceBalanceRequest.java**

```java
package com.twelvet.system.domain.dto;

public class ReduceBalanceRequest
{
    private Long userId;

    private Integer price;

    public Long getUserId()
    {
        return userId;
    }

    public void setUserId(Long userId)
    {
        this.userId = userId;
    }

    public Integer getPrice()
    {
        return price;
    }

    public void setPrice(Integer price)
    {
        this.price = price;
    }
}
```

**ReduceStockRequest.java**

```java
package com.twelvet.system.domain.dto;

public class ReduceStockRequest
{
    private Long productId;

    private Integer amount;

    public Long getProductId()
    {
        return productId;
    }

    public void setProductId(Long productId)
    {
        this.productId = productId;
    }

    public Integer getAmount()
    {
        return amount;
    }

    public void setAmount(Integer amount)
    {
        this.amount = amount;
    }
}
```

### Mapper

**AccountMapper.java**

```java
package com.twelvet.system.mapper;

import com.twelvet.system.domain.Account;

public interface AccountMapper
{
    public Account selectById(Long userId);

    public void updateById(Account account);
}
```

**OrderMapper.java**

```java
package com.twelvet.system.mapper;

import com.twelvet.system.domain.Order;

public interface OrderMapper
{
    public void insert(Order order);

    public void updateById(Order order);
}
```

**ProductMapper.java**

```java
package com.twelvet.system.mapper;

import com.twelvet.system.domain.Product;

public interface ProductMapper
{
    public Product selectById(Long productId);

    public void updateById(Product product);
}
```

### Service

**AccountService.java**

```java
package com.twelvet.system.service;

public interface AccountService
{
    /**
     * 账户扣减
     * @param userId 用户 ID
     * @param price 扣减金额
     */
    void reduceBalance(Long userId, Double price);
}
```

**OrderService.java**

```java
package com.twelvet.system.service;

import com.twelvet.system.domain.dto.PlaceOrderRequest;

public interface OrderService
{
    /**
     * 下单
     *
     * @param placeOrderRequest 订单请求参数
     */
    void placeOrder(PlaceOrderRequest placeOrderRequest);
}
```

**ProductService.java**

```java
package com.twelvet.system.service;

public interface ProductService
{
    /**
     * 扣减库存
     *
     * @param productId 商品 ID
     * @param amount 扣减数量
     * @return 商品总价
     */
    Double reduceStock(Long productId, Integer amount);
}
```

### ServiceImpl

**AccountService.java**

```java
package com.twelvet.system.service.impl;

import javax.annotation.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import com.baomidou.dynamic.datasource.annotation.DS;
import com.twelvet.system.domain.Account;
import com.twelvet.system.mapper.AccountMapper;
import com.twelvet.system.service.AccountService;
import io.seata.core.context.RootContext;

@Service
public class AccountServiceImpl implements AccountService
{
    private static final Logger log = LoggerFactory.getLogger(AccountServiceImpl.class);
    
    @Resource
    private AccountMapper accountMapper;

    /**
     * 事务传播特性设置为 REQUIRES_NEW 开启新的事务 重要！！！！一定要使用REQUIRES_NEW
     */
    @DS("account")
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void reduceBalance(Long userId, Double price)
    {
        log.info("=============ACCOUNT START=================");
        log.info("当前 XID: {}", RootContext.getXID());

        Account account = accountMapper.selectById(userId);
        Double balance = account.getBalance();
        log.info("下单用户{}余额为 {},商品总价为{}", userId, balance, price);

        if (balance < price)
        {
            log.warn("用户 {} 余额不足，当前余额:{}", userId, balance);
            throw new RuntimeException("余额不足");
        }
        log.info("开始扣减用户 {} 余额", userId);
        double currentBalance = account.getBalance() - price;
        account.setBalance(currentBalance);
        accountMapper.updateById(account);
        log.info("扣减用户 {} 余额成功,扣减后用户账户余额为{}", userId, currentBalance);
        log.info("=============ACCOUNT END=================");
    }

}
```

**OrderService.java**

```java
package com.twelvet.system.service.impl;

import javax.annotation.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.baomidou.dynamic.datasource.annotation.DS;
import com.twelvet.system.domain.Order;
import com.twelvet.system.domain.dto.PlaceOrderRequest;
import com.twelvet.system.mapper.OrderMapper;
import com.twelvet.system.service.AccountService;
import com.twelvet.system.service.OrderService;
import com.twelvet.system.service.ProductService;
import io.seata.core.context.RootContext;
import io.seata.spring.annotation.GlobalTransactional;

@Service
public class OrderServiceImpl implements OrderService
{
    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    @Resource
    private OrderMapper orderMapper;

    @Autowired
    private AccountService accountService;

    @Autowired
    private ProductService productService;

    @DS("order") // 每一层都需要使用多数据源注解切换所选择的数据库
    @Override
    @Transactional
    @GlobalTransactional // 重点 第一个开启事务的需要添加seata全局事务注解
    public void placeOrder(PlaceOrderRequest request)
    {
        log.info("=============ORDER START=================");
        Long userId = request.getUserId();
        Long productId = request.getProductId();
        Integer amount = request.getAmount();
        log.info("收到下单请求,用户:{}, 商品:{},数量:{}", userId, productId, amount);

        log.info("当前 XID: {}", RootContext.getXID());

        Order order = new Order(userId, productId, 0, amount);

        orderMapper.insert(order);
        log.info("订单一阶段生成，等待扣库存付款中");
        // 扣减库存并计算总价
        Double totalPrice = productService.reduceStock(productId, amount);
        // 扣减余额
        accountService.reduceBalance(userId, totalPrice);

        order.setStatus(1);
        order.setTotalPrice(totalPrice);
        orderMapper.updateById(order);
        log.info("订单已成功下单");
        log.info("=============ORDER END=================");
    }

}
```

**ProductService.java**

```java
package com.twelvet.system.service.impl;

import javax.annotation.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import com.baomidou.dynamic.datasource.annotation.DS;
import com.twelvet.system.domain.Product;
import com.twelvet.system.mapper.ProductMapper;
import com.twelvet.system.service.ProductService;
import io.seata.core.context.RootContext;

@Service
public class ProductServiceImpl implements ProductService
{
    private static final Logger log = LoggerFactory.getLogger(ProductServiceImpl.class);

    @Resource
    private ProductMapper productMapper;

    /**
     * 事务传播特性设置为 REQUIRES_NEW 开启新的事务 重要！！！！一定要使用REQUIRES_NEW
     */
    @DS("product")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Override
    public Double reduceStock(Long productId, Integer amount)
    {
        log.info("=============PRODUCT START=================");
        log.info("当前 XID: {}", RootContext.getXID());

        // 检查库存
        Product product = productMapper.selectById(productId);
        Integer stock = product.getStock();
        log.info("商品编号为 {} 的库存为{},订单商品数量为{}", productId, stock, amount);

        if (stock < amount)
        {
            log.warn("商品编号为{} 库存不足，当前库存:{}", productId, stock);
            throw new RuntimeException("库存不足");
        }
        log.info("开始扣减商品编号为 {} 库存,单价商品价格为{}", productId, product.getPrice());
        // 扣减库存
        int currentStock = stock - amount;
        product.setStock(currentStock);
        productMapper.updateById(product);
        double totalPrice = product.getPrice() * amount;
        log.info("扣减商品编号为 {} 库存成功,扣减后库存为{}, {} 件商品总价为 {} ", productId, currentStock, amount, totalPrice);
        log.info("=============PRODUCT END=================");
        return totalPrice;
    }

}
```

### Controller

**OrderController.java**

```java
package com.twelvet.system.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.twelvet.system.domain.dto.PlaceOrderRequest;
import com.twelvet.system.service.OrderService;
import io.swagger.annotations.ApiOperation;

@RestController
@RequestMapping("/order")
public class OrderController
{
    @Autowired
    private OrderService orderService;

    @PostMapping("/placeOrder")
    public String placeOrder(@Validated @RequestBody PlaceOrderRequest request)
    {
        orderService.placeOrder(request);
        return "下单成功";
    }

    @PostMapping("/test1")
    @ApiOperation("测试商品库存不足-异常回滚")
    public String test1()
    {
        // 商品单价10元，库存20个,用户余额50元，模拟一次性购买22个。 期望异常回滚
        orderService.placeOrder(new PlaceOrderRequest(1L, 1L, 22));
        return "下单成功";
    }

    @PostMapping("/test2")
    @ApiOperation("测试用户账户余额不足-异常回滚")
    public String test2()
    {
        // 商品单价10元，库存20个，用户余额50元，模拟一次性购买6个。 期望异常回滚
        orderService.placeOrder(new PlaceOrderRequest(1L, 1L, 6));
        return "下单成功";
    }
}
```

###) Mapper.xml

**AccountMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.twelvet.system.mapper.AccountMapper">
    
    <resultMap type="Account" id="AccountResult">
    	<id     property="id"              column="id"                />
        <result property="balance"         column="balance"           />
        <result property="lastUpdateTime"  column="last_update_time"  />
    </resultMap>
    
    <select id="selectById" parameterType="Account" resultMap="AccountResult">
        select id, balance, last_update_time 
		from account where id = #{userId}
    </select>
    
    <update id="updateById" parameterType="Account">
        update account set balance = #{balance}, last_update_time = sysdate() where id = #{id}
    </update>
    
</mapper>
```

**OrderMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.twelvet.system.mapper.OrderMapper">
    
    <resultMap type="Order" id="OrderResult">
    	<id     property="id"              column="id"                />
        <result property="userId"          column="user_id"           />
        <result property="productId"       column="product_id"        />
        <result property="amount"          column="amount"            />
        <result property="totalPrice"      column="total_price"       />
        <result property="status"          column="status"            />
        <result property="addTime"         column="add_time"          />
        <result property="lastUpdateTime"  column="last_update_time"  />
    </resultMap>
    
    <insert id="insert" parameterType="Order" useGeneratedKeys="true" keyProperty="id">
        insert into p_order (
			<if test="userId != null and userId != '' ">user_id,</if>
			<if test="productId != null and productId != '' ">product_id,</if>
			<if test="amount != null and amount != '' ">amount,</if>
			<if test="totalPrice != null and totalPrice != '' ">total_price,</if>
			<if test="status != null and status != ''">status,</if>
 			add_time
        )values(
			<if test="userId != null and userId != ''">#{userId},</if>
			<if test="productId != null and productId != ''">#{productId},</if>
			<if test="amount != null and amount != ''">#{amount},</if>
			<if test="totalPrice != null and totalPrice != ''">#{totalPrice},</if>
			<if test="status != null and status != ''">#{status},</if>
 			sysdate()
		)
    </insert>
	 
    <update id="updateById" parameterType="Order">
        update p_order 
        <set>
            <if test="userId != null and userId != ''">user_id = #{userId},</if>
            <if test="productId != null and productId != ''">product_id = #{productId},</if>
            <if test="amount != null and amount != ''">amount = #{amount},</if>
            <if test="totalPrice != null and totalPrice != ''">total_price = #{totalPrice},</if>
            <if test="status != null and status != ''">status = #{status},</if>
 			last_update_time = sysdate()
        </set>
        where id = #{id}
    </update>
    
</mapper>
```

**ProductMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.twelvet.system.mapper.ProductMapper">
    
    <resultMap type="Product" id="ProductResult">
    	<id     property="id"              column="id"                />
        <result property="price"           column="price"             />
        <result property="stock"           column="stock"             />
        <result property="lastUpdateTime"  column="last_update_time"  />
    </resultMap>
    
    <select id="selectById" parameterType="Product" resultMap="ProductResult">
        select id, price, stock, last_update_time 
		from product where id = #{productId}
    </select>
    
    <update id="updateById" parameterType="Product">
        update product set price = #{price}, stock = #{stock}, last_update_time = sysdate() where id = #{id}
    </update>
    
</mapper>
```

## 测试验证

使用`Postman`工具测试接口，注意观察运行日志，至此分布式事务集成案例全流程完毕。

### 正常下单

模拟正常下单，买一个商品 `http://localhost:9201/order/placeOrder`

```
Content-Type/application/json
{
    "userId": 1,
    "productId": 1,
    "amount": 1
}
```

### 库存不足

模拟库存不足，事务回滚 `http://localhost:9201/order/placeOrder`

```
Content-Type/application/json
{
    "userId": 1,
    "productId": 1,
    "amount": 22
}
```

### 用户余额不足

模拟用户余额不足，事务回滚 `http://localhost:9201/order/placeOrder`

```
Content-Type/application/json
{
    "userId": 1,
    "productId": 1,
    "amount": 6
}
```

## 集成Nacos配置中心

1、解压`seata-server-$version.zip`后修改`conf/registry.conf`文件：

```json
registry {
  type = "nacos"
  nacos {
    application = "seata-server"
    serverAddr = "127.0.0.1:8848"
    group = "SEATA_GROUP"
    namespace = ""
    cluster = "default"
    username = "nacos"
    password = "nacos"
  }
}

config {
  type = "nacos"
  nacos {
    serverAddr = "127.0.0.1:8848"
    namespace = ""
    group = "SEATA_GROUP"
    username = "nacos"
    password = "nacos"
  }
}
```

由于使用`nacos`作为注册中心，所以`conf`目录下的`file.conf`无需理会。然后就可以直接启动`bin/seata-server.bat`，可以在`nacos`里看到一个名为`seata-server`的服务了。 ![seata](https://www.twelvet.cn/assets/images/docs/c25fd916-9e62-48fc-8ce3-4b83111f7683.png)

2、由于`seata`使用`mysql`作为`db`高可用数据库，故需要在`mysql`创建一个`ry-seata`库，并导入数据库脚本。

```sql
-- -------------------------------- The script used when storeMode is 'db' --------------------------------
-- the table to store GlobalSession data
CREATE TABLE IF NOT EXISTS `global_table`
(
    `xid`                       VARCHAR(128) NOT NULL,
    `transaction_id`            BIGINT,
    `status`                    TINYINT      NOT NULL,
    `application_id`            VARCHAR(32),
    `transaction_service_group` VARCHAR(32),
    `transaction_name`          VARCHAR(128),
    `timeout`                   INT,
    `begin_time`                BIGINT,
    `application_data`          VARCHAR(2000),
    `gmt_create`                DATETIME,
    `gmt_modified`              DATETIME,
    PRIMARY KEY (`xid`),
    KEY `idx_gmt_modified_status` (`gmt_modified`, `status`),
    KEY `idx_transaction_id` (`transaction_id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- the table to store BranchSession data
CREATE TABLE IF NOT EXISTS `branch_table`
(
    `branch_id`         BIGINT       NOT NULL,
    `xid`               VARCHAR(128) NOT NULL,
    `transaction_id`    BIGINT,
    `resource_group_id` VARCHAR(32),
    `resource_id`       VARCHAR(256),
    `branch_type`       VARCHAR(8),
    `status`            TINYINT,
    `client_id`         VARCHAR(64),
    `application_data`  VARCHAR(2000),
    `gmt_create`        DATETIME(6),
    `gmt_modified`      DATETIME(6),
    PRIMARY KEY (`branch_id`),
    KEY `idx_xid` (`xid`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- the table to store lock data
CREATE TABLE IF NOT EXISTS `lock_table`
(
    `row_key`        VARCHAR(128) NOT NULL,
    `xid`            VARCHAR(96),
    `transaction_id` BIGINT,
    `branch_id`      BIGINT       NOT NULL,
    `resource_id`    VARCHAR(256),
    `table_name`     VARCHAR(32),
    `pk`             VARCHAR(36),
    `gmt_create`     DATETIME,
    `gmt_modified`   DATETIME,
    PRIMARY KEY (`row_key`),
    KEY `idx_branch_id` (`branch_id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- for AT mode you must to init this sql for you business database. the seata server not need it.
CREATE TABLE IF NOT EXISTS `undo_log`
(
    `branch_id`     BIGINT(20)   NOT NULL COMMENT 'branch transaction id',
    `xid`           VARCHAR(100) NOT NULL COMMENT 'global transaction id',
    `context`       VARCHAR(128) NOT NULL COMMENT 'undo_log context,such as serialization',
    `rollback_info` LONGBLOB     NOT NULL COMMENT 'rollback info',
    `log_status`    INT(11)      NOT NULL COMMENT '0:normal status,1:defense status',
    `log_created`   DATETIME(6)  NOT NULL COMMENT 'create datetime',
    `log_modified`  DATETIME(6)  NOT NULL COMMENT 'modify datetime',
    UNIQUE KEY `ux_undo_log` (`xid`, `branch_id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8mb4 COMMENT ='AT transaction mode undo table';
```

3、`config.txt`文件复制到seata目录

**config.txt**

```text
service.vgroupMapping.twelvet-system-group=default
store.mode=db
store.db.datasource=druid
store.db.dbType=mysql
store.db.driverClassName=com.mysql.jdbc.Driver
store.db.url=jdbc:mysql://127.0.0.1:3306/ry-seata?useUnicode=true
store.db.user=root
store.db.password=password
store.db.minConn=5
store.db.maxConn=30
store.db.globalTable=global_table
store.db.branchTable=branch_table
store.db.queryLimit=100
store.db.lockTable=lock_table
store.db.maxWait=5000
```

4、`nacos-config.sh`复制到seata的conf目录

**nacos-config.sh**

```sh
#!/usr/bin/env bash
# Copyright 1999-2019 Seata.io Group.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at、
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

while getopts ":h:p:g:t:u:w:" opt
do
  case $opt in
  h)
    host=$OPTARG
    ;;
  p)
    port=$OPTARG
    ;;
  g)
    group=$OPTARG
    ;;
  t)
    tenant=$OPTARG
    ;;
  u)
    username=$OPTARG
    ;;
  w)
    password=$OPTARG
    ;;
  ?)
    echo " USAGE OPTION: $0 [-h host] [-p port] [-g group] [-t tenant] [-u username] [-w password] "
    exit 1
    ;;
  esac
done

urlencode() {
  for ((i=0; i < ${#1}; i++))
  do
    char="${1:$i:1}"
    case $char in
    [a-zA-Z0-9.~_-]) printf $char ;;
    *) printf '%%%02X' "'$char" ;;
    esac
  done
}

if [[ -z ${host} ]]; then
    host=localhost
fi
if [[ -z ${port} ]]; then
    port=8848
fi
if [[ -z ${group} ]]; then
    group="SEATA_GROUP"
fi
if [[ -z ${tenant} ]]; then
    tenant=""
fi
if [[ -z ${username} ]]; then
    username=""
fi
if [[ -z ${password} ]]; then
    password=""
fi

nacosAddr=$host:$port
contentType="content-type:application/json;charset=UTF-8"

echo "set nacosAddr=$nacosAddr"
echo "set group=$group"

failCount=0
tempLog=$(mktemp -u)
function addConfig() {
  curl -X POST -H "${contentType}" "http://$nacosAddr/nacos/v1/cs/configs?dataId=$(urlencode $1)&group=$group&content=$(urlencode $2)&tenant=$tenant&username=$username&password=$password" >"${tempLog}" 2>/dev/null
  if [[ -z $(cat "${tempLog}") ]]; then
    echo " Please check the cluster status. "
    exit 1
  fi
  if [[ $(cat "${tempLog}") =~ "true" ]]; then
    echo "Set $1=$2 successfully "
  else
    echo "Set $1=$2 failure "
    (( failCount++ ))
  fi
}

count=0
for line in $(cat $(dirname "$PWD")/config.txt | sed s/[[:space:]]//g); do
  (( count++ ))
	key=${line%%=*}
    value=${line#*=}
	addConfig "${key}" "${value}"
done

echo "========================================================================="
echo " Complete initialization parameters,  total-count:$count ,  failure-count:$failCount "
echo "========================================================================="

if [[ ${failCount} -eq 0 ]]; then
	echo " Init nacos config finished, please start seata-server. "
else
	echo " init nacos config fail. "
fi
```

5、执行命令，后面填写`nacos`的IP地址，我的是本机所以是`127.0.0.1`

```sh
sh nacos-config.sh 127.0.0.1
```

成功后`nacos`配置列表也能查询到相关配置 ![nacos](https://www.twelvet.cn/assets/images/docs/e2a8ed2b-961c-461b-9e9d-2e515b9fc0f3.png)

6、修改服务配置文件

```yml
# spring配置
spring: 
  datasource:
    dynamic:
      # 开启seata代理
      seata: true
	  
# seata配置
seata:
  enabled: true
  # Seata 应用编号，默认为 ${spring.application.name}
  application-id: ${spring.application.name}
  # Seata 事务组编号，用于 TC 集群名
  tx-service-group: ${spring.application.name}-group
  # 关闭自动代理
  enable-auto-data-source-proxy: false
  # 服务配置项
  service:
    # 虚拟组和分组的映射
    vgroup-mapping:
      twelvet-system-group: default
  config:
    type: nacos
    nacos:
      serverAddr: 127.0.0.1:8848
      group: SEATA_GROUP
      namespace:
  registry:
    type: nacos
    nacos:
      application: seata-server
      server-addr: 127.0.0.1:8848
      namespace:
```

7、测试验证

[参考测试验证](https://doc.twelvet.cn/twelvet-cloud/cloud/seata.html#测试验证)

## 测试Feign服务调用

测试使用`twelvet-file`添加`Feign`调用测试文件入库，验证分布式数据库调用执行结果，也适用于新的应用。

### 1、添加测试数据库seata_file

```sql
# 文件数据库信息 seata_file
DROP DATABASE IF EXISTS seata_file;
CREATE DATABASE seata_file;

DROP TABLE IF EXISTS seata_file.sys_file_info;
CREATE TABLE seata_file.sys_file_info
(
    file_id           BIGINT(11)       NOT NULL AUTO_INCREMENT       COMMENT '文件编号',
    file_name         VARCHAR(50)      DEFAULT ''                    COMMENT '文件名称',
    file_path         VARCHAR(255)     DEFAULT ''                    COMMENT '文件路径',
    PRIMARY KEY (file_id)
) ENGINE = INNODB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8mb4;

DROP TABLE IF EXISTS seata_file.undo_log;
CREATE TABLE seata_file.undo_log
(
    id            BIGINT(20) NOT NULL AUTO_INCREMENT,
    branch_id     BIGINT(20) NOT NULL,
    xid           VARCHAR(100) NOT NULL,
    context       VARCHAR(128) NOT NULL,
    rollback_info LONGBLOB     NOT NULL,
    log_status    INT(11) NOT NULL,
    log_created   DATETIME     NOT NULL,
    log_modified  DATETIME     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY ux_undo_log (xid, branch_id)
) ENGINE = INNODB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8mb4;
  `seata_file`
```

###-file) 2、添加示例代码twelvet-modules-file

`twelvet-modules-file`应用添加示例代码

**SysFileController.java**

```java
package com.twelvet.file.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.twelvet.common.core.domain.R;
import com.twelvet.common.core.utils.file.FileUtils;
import com.twelvet.common.core.web.domain.AjaxResult;
import com.twelvet.file.service.ISysFileInfoService;
import com.twelvet.file.service.ISysFileService;
import com.twelvet.system.api.domain.SysFile;
import com.twelvet.system.api.domain.SysFileInfo;

/**
 * 文件请求处理
 * 
 * @author twelvet
 */
@RestController
public class SysFileController
{
    private static final Logger log = LoggerFactory.getLogger(SysFileController.class);

    @Autowired
    private ISysFileService sysFileService;

    @Autowired
    private ISysFileInfoService sysFileInfoService;
    
    /**
     * 文件上传请求
     */
    @PostMapping("upload")
    public R<SysFile> upload(MultipartFile file)
    {
        try
        {
            // 上传并返回访问地址
            String url = sysFileService.uploadFile(file);
            SysFile sysFile = new SysFile();
            sysFile.setName(FileUtils.getName(url));
            sysFile.setUrl(url);
            return R.ok(sysFile);
        }
        catch (Exception e)
        {
            log.error("上传文件失败", e);
            return R.fail(e.getMessage());
        }
    }
    
    @PostMapping("/insertFile")
    public AjaxResult insertFile(@RequestBody SysFileInfo sysFileInfo)
    {
        sysFileInfoService.insertFile(sysFileInfo);
        return AjaxResult.success();
    }
}
```

**ISysFileInfoService.java**

```java
package com.twelvet.file.service;

import com.twelvet.system.api.domain.SysFileInfo;

public interface ISysFileInfoService
{
    void insertFile(SysFileInfo fileInfo);
}
```

**SysFileInfoServiceImpl.java**

```java
package com.twelvet.file.service;

import javax.annotation.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import com.baomidou.dynamic.datasource.annotation.DS;
import com.twelvet.file.mapper.SysFileInfoMapper;
import com.twelvet.system.api.domain.SysFileInfo;
import io.seata.core.context.RootContext;

@Service
public class SysFileInfoServiceImpl implements ISysFileInfoService
{
    private static final Logger log = LoggerFactory.getLogger(SysFileInfoServiceImpl.class);

    @Resource
    private SysFileInfoMapper sysFileInfoMapper;

    /**
     * 事务传播特性设置为 REQUIRES_NEW 开启新的事务 重要！！！！一定要使用REQUIRES_NEW
     */
    @DS("file")
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void insertFile(SysFileInfo fileInfo)
    {
        log.info("=============FILE START=================");
        log.info("当前 XID: {}", RootContext.getXID());

        sysFileInfoMapper.insert(fileInfo);
        log.info("=============FILE END=================");
    }

}
```

**SysFileInfoMapper.java**

```java
package com.twelvet.file.mapper;

import com.twelvet.system.api.domain.SysFileInfo;

public interface SysFileInfoMapper
{
    public void insert(SysFileInfo fileInfo);
}
```

**SysFileInfoMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.twelvet.file.mapper.SysFileInfoMapper">
    
    <resultMap type="SysFileInfo" id="SysFileInfoResult">
    	<id     property="fileId"         column="file_id"          />
        <result property="fileName"       column="file_name"        />
        <result property="filePath"       column="file_path"        />
    </resultMap>
    
    <insert id="insert" parameterType="SysFileInfo">
        insert into sys_file_info (file_name, file_path) values (#{fileName}, #{filePath})
    </insert>
    
</mapper>
```

**pom.xml**

```xml
<!-- Mysql Connector -->
<dependency>
	<groupId>mysql</groupId>
	<artifactId>mysql-connector-java</artifactId>
</dependency>

<!-- twelvet Common DataSource -->
<dependency>
	<groupId>com.twelvet</groupId>
	<artifactId>twelvet-framework-datasource</artifactId>
</dependency>
```

**RuoYFileApplication.java**

```java
// 添加扫描mapper包路径
@MapperScan("com.twelvet.**.mapper")
```

###-dev-yml) 3、修改配置文件twelvet-file-dev.yml

```yml
# 本地文件上传    
file:
    domain: http://127.0.0.1:9300
    path: D:/twelvet/uploadPath
    prefix: /statics

# FastDFS配置
fdfs:
  domain: http://8.129.231.12
  soTimeout: 3000
  connectTimeout: 2000
  trackerList: 8.129.231.12:22122

# Minio配置
minio:
  url: http://8.129.231.12:9000
  accessKey: minioadmin
  secretKey: minioadmin
  bucketName: test

# spring配置
spring: 
  datasource:
    druid:
      stat-view-servlet:
        enabled: true
        loginUsername: admin
        loginPassword: 123456
    dynamic:
      druid:
        initial-size: 5
        min-idle: 5
        maxActive: 20
        maxWait: 60000
        timeBetweenEvictionRunsMillis: 60000
        minEvictableIdleTimeMillis: 300000
        validationQuery: SELECT 1 FROM DUAL
        testWhileIdle: true
        testOnBorrow: false
        testOnReturn: false
        poolPreparedStatements: true
        maxPoolPreparedStatementPerConnectionSize: 20
        filters: stat,wall,slf4j
        connectionProperties: druid.stat.mergeSql\=true;druid.stat.slowSqlMillis\=5000
      datasource:
          # 主库数据源
          master:
            driver-class-name: com.mysql.cj.jdbc.Driver
            url: jdbc:mysql://localhost:3306/ry-cloud?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8
            username: root
            password: password
          # seata_file数据源
          file:
            username: root
            password: password
            url: jdbc:mysql://localhost:3306/seata_file?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8
            driver-class-name: com.mysql.cj.jdbc.Driver
      seata: true

# seata配置
seata:
  # 默认关闭，如需启用spring.datasource.dynami.seata需要同时开启
  enabled: true
  # Seata 应用编号，默认为 ${spring.application.name}
  application-id: ${spring.application.name}
  # Seata 事务组编号，用于 TC 集群名
  tx-service-group: ${spring.application.name}-group
  # 关闭自动代理
  enable-auto-data-source-proxy: false
  # 服务配置项
  service:
    # 虚拟组和分组的映射
    vgroup-mapping:
      twelvet-file-group: default
  config:
    type: nacos
    nacos:
      serverAddr: 127.0.0.1:8848
      group: SEATA_GROUP
      namespace:
  registry:
    type: nacos
    nacos:
      application: seata-server
      server-addr: 127.0.0.1:8848
      namespace:

# mybatis配置
mybatis:
    # 搜索指定包别名
    typeAliasesPackage: com.twelvet.file
    # 配置mapper的扫描，找到所有的mapper.xml映射文件
    mapperLocations: classpath:mapper/**/*.xml

# swagger配置
swagger:
  title: 文件模块接口文档
  license: Powered By twelvet
  licenseUrl: https://twelvet.cn
```

### 4、Feign添加保存文件接口

**RemoteFileService.java**

```java
package com.twelvet.system.api;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import com.twelvet.common.core.constant.ServiceNameConstants;
import com.twelvet.common.core.domain.R;
import com.twelvet.system.api.domain.SysFile;
import com.twelvet.system.api.domain.SysFileInfo;
import com.twelvet.system.api.factory.RemoteFileFallbackFactory;

/**
 * 文件服务
 * 
 * @author twelvet
 */
@FeignClient(contextId = "remoteFileService", value = ServiceNameConstants.FILE_SERVICE, fallbackFactory = RemoteFileFallbackFactory.class)
public interface RemoteFileService
{
    /**
     * 上传文件
     *
     * @param file 文件信息
     * @return 结果
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public R<SysFile> upload(@RequestPart(value = "file") MultipartFile file);
    
    /**
     * 保存系统文件
     *
     * @param sysFileInfo 系统文件
     * @return 结果
     */
    @PostMapping("/insertFile")
    R<Boolean> saveFile(@RequestBody SysFileInfo sysFileInfo);
}
```

**RemoteFileFallbackFactory.java**

```java
package com.twelvet.system.api.factory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import com.twelvet.common.core.domain.R;
import com.twelvet.system.api.RemoteFileService;
import com.twelvet.system.api.domain.SysFile;
import com.twelvet.system.api.domain.SysFileInfo;
import feign.hystrix.FallbackFactory;

/**
 * 文件服务降级处理
 * 
 * @author twelvet
 */
@Component
public class RemoteFileFallbackFactory implements FallbackFactory<RemoteFileService>
{
    private static final Logger log = LoggerFactory.getLogger(RemoteFileFallbackFactory.class);

    @Override
    public RemoteFileService create(Throwable throwable)
    {
        log.error("文件服务调用失败:{}", throwable.getMessage());
        return new RemoteFileService()
        {
            @Override
            public R<SysFile> upload(MultipartFile file)
            {
                return R.fail("上传文件失败:" + throwable.getMessage());
            }

            @Override
            public R<Boolean> saveFile(SysFileInfo sysFileInfo)
            {
                return R.fail("文件入库失败:" + throwable.getMessage());
            }
        };
    }
}
```

**SysFileInfo.java**

```java
package com.twelvet.system.api.domain;

public class SysFileInfo
{
    /**
     * 文件编号
     */
    private Long fileId;

    /**
     * 文件名称
     */
    private String fileName;

    /**
     * 文件路径
     */
    private String filePath;

    public Long getFileId()
    {
        return fileId;
    }

    public void setFileId(Long fileId)
    {
        this.fileId = fileId;
    }

    public String getFileName()
    {
        return fileName;
    }

    public void setFileName(String fileName)
    {
        this.fileName = fileName;
    }

    public String getFilePath()
    {
        return filePath;
    }

    public void setFilePath(String filePath)
    {
        this.filePath = filePath;
    }
}
```

### 5、订单接口中添加Feign文件接口

**OrderServiceImpl.java**

```java
package com.twelvet.system.service.impl;

import javax.annotation.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.baomidou.dynamic.datasource.annotation.DS;
import com.twelvet.system.api.RemoteFileService;
import com.twelvet.system.api.domain.SysFileInfo;
import com.twelvet.system.domain.Order;
import com.twelvet.system.domain.dto.PlaceOrderRequest;
import com.twelvet.system.mapper.OrderMapper;
import com.twelvet.system.service.AccountService;
import com.twelvet.system.service.OrderService;
import com.twelvet.system.service.ProductService;
import io.seata.core.context.RootContext;
import io.seata.spring.annotation.GlobalTransactional;

@Service
public class OrderServiceImpl implements OrderService
{
    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    @Resource
    private OrderMapper orderMapper;

    @Autowired
    private AccountService accountService;

    @Autowired
    private ProductService productService;
    
    @Autowired
    private RemoteFileService remoteFileService;
    
    @DS("order") // 每一层都需要使用多数据源注解切换所选择的数据库
    @Override
    @Transactional
    @GlobalTransactional // 重点 第一个开启事务的需要添加seata全局事务注解
    public void placeOrder(PlaceOrderRequest request)
    {
        log.info("=============ORDER START=================");
        Long userId = request.getUserId();
        Long productId = request.getProductId();
        Integer amount = request.getAmount();
        log.info("收到下单请求,用户:{}, 商品:{},数量:{}", userId, productId, amount);

        log.info("当前 XID: {}", RootContext.getXID());

        Order order = new Order(userId, productId, 0, amount);

        orderMapper.insert(order);
        log.info("订单一阶段生成，等待扣库存付款中");

        // 测试fegin调用
        SysFileInfo sysFileInfo = new SysFileInfo();
        sysFileInfo.setFileName("name" + order.getId());
        sysFileInfo.setFilePath("/home/twelvet/name" + order.getId() + ".png");
        remoteFileService.saveFile(sysFileInfo);

        // 扣减库存并计算总价
        Double totalPrice = productService.reduceStock(productId, amount);
        // 扣减余额
        accountService.reduceBalance(userId, totalPrice);

        order.setStatus(1);
        order.setTotalPrice(totalPrice);
        orderMapper.updateById(order);
        log.info("订单已成功下单");
        log.info("=============ORDER END=================");
    }

}
```

### 6、添加seata应用配置文件

**config.txt**

```sh
service.vgroupMapping.twelvet-file-group=default
```

执行`nacos-config.sh`添加到`nacos`配置中心。

6、测试验证。

[参考接口测试验证](https://doc.twelvet.cn/twelvet-cloud/cloud/seata.html#测试验证)

- （订单成功：文件入库一起提交）
- （订单失败：文件入库同时回滚）

::: tip 提示

`spring-cloud-starter-alibaba-seata`依赖会传递`Seata`的`XID`，否则的话需要自己在`header`里传递`XID`。

:::