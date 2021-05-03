---
order: 4
---
# 后台手册

## 分页实现

### 前端调用实现

RESTful参数必须传送`current=1&pageSize=10`

### 后台逻辑实现

```java
@PostMapping("/list")
@ResponseBody
public TableDataInfo list(User user) {
    // 自动装配分页
    startPage();
    List<User> list = userService.selectUserList(user);
    return AjaxResult.success(getDataTable(list));
}
```

- 常见坑点1：`selectPostById`莫名其妙的分页。例如下面这段代码

```java
startPage();
List<User> list;
if(user != null) {
    list = userService.selectUserList(user);
} else {
    list = new ArrayList<User>();
}
Post post = postService.selectPostById(1L);
return AjaxResult.success(getDataTable(list));
```

原因分析：这种情况下由于`user`存在`null`的情况，就会导致`pageHelper`生产了一个分页参数，但是没有被消费，这个参数就会一直保留在这个线程上。 当这个线程再次被使用时，就可能导致不该分页的方法去消费这个分页参数，这就产生了莫名其妙的分页。
 上面这个代码，应该写成下面这个样子才能保证安全。

```java
List<User> list;
if(user != null) {
	startPage();
	list = userService.selectUserList(user);
} else {
	list = new ArrayList<User>();
}
Post post = postService.selectPostById(1L);
return AjaxResult.success(getDataTable(list));
```

- 常见坑点2：添加了`startPage`方法。也没有正常分页。例如下面这段代码

```java
startPage();
Post post = postService.selectPostById(1L);
List<User> list = userService.selectUserList(user);
return AjaxResult.success(getDataTable(list));
```

原因分析：只对该语句以后的第一个查询`（Select）`语句得到的数据进行分页。
 上面这个代码，应该写成下面这个样子才能正常分页。

```java
Post post = postService.selectPostById(1L);
startPage();
List<User> list = userService.selectUserList(user);
return AjaxResult.success(getDataTable(list));
```

注意

如果改为其他数据库需修改配置`application.yml`文件中的属性`helperDialect=你的数据库`

## 导入导出

在实际开发中经常需要使用导入导出功能来加快数据的操作。在项目中可以使用注解来完成此项功能。 在需要被导入导出的实体类属性添加`@Excel`注解，目前支持参数如下：

| 参数             | 类型    | 默认值                     | 描述                                                |
| ---------------- | ------- | -------------------------- | --------------------------------------------------- |
| sort             | int     | Integer.MAX_VALUE          | 导出时在excel中排序                                 |
| name             | String  | 空                         | 导出到Excel中的名字                                 |
| dateFormat       | String  | 空                         | 日期格式, 如: yyyy-MM-dd                            |
| readConverterExp | String  | 空                         | 读取内容转表达式 (如: 0=男,1=女,2=未知)             |
| separator        | String  | ,                          | 分隔符，读取字符串组内容                            |
| scale            | int     | -1                         | BigDecimal 精度 默认:-1(默认不开启BigDecimal格式化) |
| roundingMode     | int     | BigDecimal.ROUND_HALF_EVEN | BigDecimal 舍入规则 默认:BigDecimal.ROUND_HALF_EVEN |
| columnType       | Enum    | Type.STRING                | 导出类型（0数字 1字符串 2图片）                     |
| height           | String  | 14                         | 导出时在excel中每个列的高度 单位为字符              |
| width            | String  | 16                         | 导出时在excel中每个列的宽 单位为字符                |
| suffix           | String  | 空                         | 文字后缀,如% 90 变成90%                             |
| defaultValue     | String  | 空                         | 当值为空时,字段的默认值                             |
| prompt           | String  | 空                         | 提示信息                                            |
| combo            | String  | Null                       | 设置只能选择不能输入的列内容                        |
| targetAttr       | String  | 空                         | 另一个类中的属性名称,支持多级获取,以小数点隔开      |
| isStatistics     | boolean | false                      | 是否自动统计数据,在最后追加一行统计数据总和         |
| type             | Enum    | Type.ALL                   | 字段类型（0：导出导入；1：仅导出；2：仅导入）       |

### 流程

1、前端调用方法（参考如下）

```typescript
import { download } from '@/utils/request'

/**
 * 导出Excel
 * @param params
 */
export async function exportExcel(params?: { [key: string]: any }) {
    return download(`${controller}/export`, params);
}
```

2、添加导出按钮事件

```typescript
import { Button } from 'antd'
import { exportExcel } from './service'

<Button
type="primary"
onClick={() => {
   	exportExcel({
    	...formRef.current?.getFieldsValue()
	})
}}
    >
	导出数据
</Button>

```

3、在实体变量上添加@Excel注解

```java
@Excel(name = "用户序号", prompt = "用户编号")
private Long userId;

@Excel(name = "用户名称")
private String userName;
	
@Excel(name = "用户性别", readConverterExp = "0=男,1=女,2=未知")
private String sex;

@Excel(name = "最后登陆时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
private Date loginDate;
```

4、在Controller添加导出方法

```java
/**
 * 用户用户导出
 *
 * @param response HttpServletResponse
 * @param user     SysUser
 */
@ApiOperationSupport(author = "twelvet")
@ApiOperation(value = "用户用户导出")
@PostMapping("/export")
@Log(service = "用户管理", businessType = BusinessType.EXPORT)
@PreAuthorize("@role.hasPermi('system:user:export')")
public void export(HttpServletResponse response, @RequestBody SysUser user) {
    List<SysUser> list = iSysUserService.selectUserList(user);
    ExcelUtils<SysUser> excelUtils = new ExcelUtils<>(SysUser.class);
    excelUtils.exportExcel(response, list, "用户数据");
}
```

### 导入实现流程

1.定义api

```typescript
import { upload } from '@/utils/request'

/**
 * 上传数据
 * @param params
 */
export async function importData(formData: FormData) {
    return upload(`${controller}/importData`, formData);
}

```

2.添加按钮上传<font color='red'>（此处省略代码，详细请看项目）</font>

```typescript
import { importData } from './service'

/**
 * 用户上传数据
 */
const handleUpload = async () => {
    try {

        setUploadLoading(true)

        // 表单数据
        const formData = new FormData();

        // 添加Excel数据源
        excelFiles.forEach((file: RcFile) => {
            formData.append('files', file);
        });

        // 设置是否覆盖参数
        formData.append('cover', `${cover}`)

        const { code, msg } = await importData(formData)
        if (code != 200) {
            return message.error(msg)
        }
        message.success(msg)

        // 初始化数据
        setExcelFiles([])

        // 取消模态框
        props.onCancel()

        // 刷新页面
        props.ok()
    } catch (e) {
        system.error(e)
    } finally {
        setUploadLoading(false)
    }

}
```

4.在实体变量上添加@Excel注解，默认为导出导入，也可以单独设置仅导入Type.IMPORT

```java
@Excel(name = "用户序号")
private Long id;

@Excel(name = "部门编号", type = Type.IMPORT)
private Long deptId;

@Excel(name = "用户名称")
private String userName;

/** 导出部门多个对象 */
@Excels({
	@Excel(name = "部门名称", targetAttr = "deptName", type = Type.EXPORT),
	@Excel(name = "部门负责人", targetAttr = "leader", type = Type.EXPORT)
})
private SysDept dept;

/** 导出部门单个对象 */
@Excel(name = "部门名称", targetAttr = "deptName", type = Type.EXPORT)
private SysDept dept;

```

5.在Controller添加导入方法，updateSupport属性为是否存在则覆盖（可选）

```java
/**
 * 用户数据导入
 *
 * @param files MultipartFile[]
 * @param cover 是否允许覆盖
 * @return AjaxResult
 * @throws Exception Exception
 */
@ApiOperationSupport(author = "twelvet")
@ApiOperation(value = "用户数据导入")
@PostMapping("/importData")
@Log(service = "用户管理", businessType = BusinessType.IMPORT)
@PreAuthorize("@role.hasPermi('system:user:import')")
public AjaxResult importData(MultipartFile[] files, boolean cover) throws Exception {
    ExcelUtils<SysUser> excelUtils = new ExcelUtils<>(SysUser.class);
    // 支持多数据源导入
    for (MultipartFile file : files) {
        List<SysUser> userList = excelUtils.importExcel(file.getInputStream());
        String operName = SecurityUtils.getUsername();
        iSysUserService.importUser(userList, cover, operName);
    }
    return AjaxResult.success();
}
```



## 分布式文件上传下载

### 上传文件

1.建立api

```typescript
import { upload } from '@/utils/request'

// 请求的控制器名称
const controller = "/dfs"

/**
 * 上传数据
 * @param params
 */
export async function uploadFile(formData: FormData) {
    // 批量上传接口
    return upload(`${controller}/batchUpload`, formData);
}
```

2.编写上传逻辑<font color='red'>（此处省略代码，详细请看项目）</font>

```typescript
/**
 * 上传数据
 */
const handleUpload = async () => {
    try {

        if(files.length <= 0){
            return message.warning('请先选择需上传的图片')
        }

        setUploadLoading(true)

        // 表单数据
        const formData = new FormData();

        // 添加数据源
        files.forEach((file: RcFile) => {
            formData.append('files', file);
        });

        const { code, msg } = await uploadFile(formData)

        if (code != 200) {
            return message.error(msg)
        }

        message.success(msg)

        // 初始化数据
        setFiles([])

        // 取消模态框
        props.onCancel()

        // 刷新页面
        props.ok()
    } catch (e) {
        system.error(e)
    } finally {
        setUploadLoading(false)
    }

}
```



### 下载实现流程

直接采用封装好的api即可

```typescript
import { download } from '@/utils/request'

/**
 * 下载文件
 * @param fileId 文件id
 */
export async function downloadFile(fileId: string) {
    return download(`${controller}/download/${fileId}`);
}
```



## 权限注解

1. 数据权限示例。

```java
// 符合system:user:list权限要求
@PreAuthorize("@role.hasPermi('system:user:list')")

// 不符合system:user:list权限要求
@PreAuthorize("@role.lacksPermi('system:user:list')")

// 符合system:user:add或system:user:edit权限要求即可
@PreAuthorize("@role.hasAnyPermi('{ "system:user:add", "system:user:edit" }')")
```

1. 角色权限示例。

```java
// 属于user角色
@PreAuthorize(hasRole = "user")
@PreAuthorize("@role.hasRole('user')")

// 不属于user角色
@PreAuthorize(lacksRole = "user")
@PreAuthorize("@role.lacksRole('user')")

// 属于user或者admin之一
@PreAuthorize("@role.hasAnyRoles('{ "user", "admin" }')")
```

## 事务管理

新建的`Spring Boot`项目中，一般都会引用`spring-boot-starter`或者`spring-boot-starter-web`，而这两个起步依赖中都已经包含了对于`spring-boot-starter-jdbc`或`spring-boot-starter-data-jpa`的依赖。 当我们使用了这两个依赖的时候，框架会自动默认分别注入`DataSourceTransactionManager`或`JpaTransactionManager`。 所以我们不需要任何额外配置就可以用`@Transactional`注解进行事务的使用。

```java
// @Transactional注解只能应用到public可见度的方法上，可以被应用于接口定义和接口方法，方法会覆盖类上面声明的事务。
@Transactional*(rollbackFor = Exception.class, propagation = Propagation.REQUIRED)
    
// 如需要分布式事务，请使用
@GlobalTransactional
```

`Transactional`注解的常用属性表：

| 属性          | 说明                                                         |
| ------------- | :----------------------------------------------------------- |
| propagation   | 事务的传播行为，默认值为 REQUIRED。                          |
| isolation     | 事务的隔离度，默认值采用 DEFAULT                             |
| timeout       | 事务的超时时间，默认值为-1，不超时。如果设置了超时时间(单位秒)，那么如果超过该时间限制了但事务还没有完成，则自动回滚事务。 |
| read-only     | 指定事务是否为只读事务，默认值为 false；为了忽略那些不需要事务的方法，比如读取数据，可以设置 read-only 为 true。 |
| rollbackFor   | 用于指定能够触发事务回滚的异常类型，如果有多个异常类型需要指定，各类型之间可以通过逗号分隔。{xxx1.class, xxx2.class,……} |
| noRollbackFor | 抛出 no-rollback-for 指定的异常类型，不回滚事务。{xxx1.class, xxx2.class,……} |
| ....          |                                                              |

## 系统日志

在需要被记录日志的`controller`方法上添加`@Log`<font color='red'>（注意：仅用于后台日志记录）</font>注解，使用方法如下：

```java
@Log(service = "用户管理", businessType = BusinessType.INSERT) 
```

支持参数如下：

| 参数              | 类型         | 默认值 | 描述                                                         |
| ----------------- | ------------ | ------ | ------------------------------------------------------------ |
| service           | String       | 空     | 操作模块                                                     |
| businessType      | BusinessType | OTHER  | 操作功能（OTHER其他 INSERT新增 UPDATE修改 DELETE删除 GRANT授权 EXPORT导出 IMPORT导入 FORCE强退 GENCODE生成代码 CLEAN清空数据） |
| operatorType      | OperatorType | MANAGE | 操作人类别（OTHER其他 MANAGE后台用户 MOBILE手机端用户）      |
| isSaveRequestData | boolean      | true   | 是否保存请求的参数                                           |

::: tip

关于自定义操作功能使用流程
:::
1、在`BusinessType`中新增业务操作类型如:

```java
/**
 * 测试
 */
TEST,
```

2、在`sys_dict_data`字典数据表中初始化操作业务类型

```sql
insert into sys_dict_data values(25, 10, '测试',     '10', 'sys_oper_type',       '',   'primary', 'N', '0', 'admin', '2018-03-16 11-33-00', 'twt', '2018-03-16 11-33-00', '测试操作');
```

3、在`Controller`中使用注解

```java
@Log(service = "测试标题", businessType = BusinessType.TEST)
```

逻辑实现代码 `com.twelvet.framework.log.aspectj.LogAspect`
 查询操作详细记录可以登录系统（系统管理-操作日志）

##  数据权限

对于基于集团性的应用系统而言，更多需要控制好各自公司的数据。如设置只能看本公司、或者本部门的数据，对于特殊的领导，可能需要跨部门的数据， 因此程序不能硬编码那个领导该访问哪些数据，需要进行后台的权限和数据权限的控制。

::: tip

默认系统管理员`admin`拥有所有数据权限`（userId=1）`，默认角色拥有所有数据权限（如不需要数据权限不用设置数据权限操作）
:::

关于数据权限使用流程

支持参数如下：

| 参数      | 类型   | 默认值 | 描述         |
| --------- | ------ | ------ | ------------ |
| deptAlias | String | 空     | 部门表的别名 |
| userAlias | String | 空     | 用户表的别名 |

1、在（系统管理-角色管理）设置需要数据权限的角色 目前支持以下几种权限

- 全部数据权限
- 自定数据权限
- 部门数据权限
- 部门及以下数据权限
- 仅本人数据权限

2、在需要数据权限控制方法上添加`@DataScope`注解，其中`d`和`u`用来表示表的别名

```java
// 部门数据权限注解
@DataScope(deptAlias = "u")
// 部门及用户权限注解
@DataScope(deptAlias = "d", userAlias = "u")
```

3、在`mybatis`查询底部标签添加数据范围过滤

```xml
<!-- 数据范围过滤 -->
${params.dataScope}
```

用户管理（未过滤数据权限的情况）：

```sql
select u.user_id, u.dept_id, u.login_name, u.user_name, u.email
	, u.phonenumber, u.password, u.sex, u.avatar, u.salt
	, u.status, u.del_flag, u.login_ip, u.login_date, u.create_by
	, u.create_time, u.remark, d.dept_name
from sys_user u
	left join sys_dept d on u.dept_id = d.dept_id
where u.del_flag = '0'
```

用户管理（已过滤数据权限的情况）：

```sql
select u.user_id, u.dept_id, u.login_name, u.user_name, u.email
	, u.phonenumber, u.password, u.sex, u.avatar, u.salt
	, u.status, u.del_flag, u.login_ip, u.login_date, u.create_by
	, u.create_time, u.remark, d.dept_name
from sys_user u
	left join sys_dept d on u.dept_id = d.dept_id
where u.del_flag = '0'
	and u.dept_id in (
		select dept_id
		from sys_role_dept
		where role_id = 2
	)
```

结果很明显，我们多了如下语句。通过角色部门表`（sys_role_dept）`完成了数据权限过滤

```sql
and u.dept_id in (
	select dept_id
	from sys_role_dept
	where role_id = 2
)
```

逻辑实现代码 `com.twelvet.framework.datascope.aspectj.SysDataScopeAspect`

::: tip

仅实体继承BaseEntity才会进行处理，SQL语句会存放到`BaseEntity`对象中的`params`属性中供xml参数`params.dataScope`获取。
:::
##  多数据源

 在需要切换数据源`Service`或`Mapper`方法上添加`@DataSource`注解
 `@DS(value = 'master')`，其中`value`用来表示数据源名称

也可以使用封装的注解`com.twelvet.framework.datasource.annotation`

::: tip

关于多数据源使用流程（如果有多个，可以参考slave添加）
:::
支持参数如下：

| 参数  | 类型           | 默认值                | 描述 |
| ----- | -------------- | --------------------- | ---- |
| value | DataSourceType | DataSourceType.MASTER | 主库 |

1、在nacos配置中心里配置`twelvet-xxx-dev.yml`配置从库数据源

```java
# 从库数据源
slave:
	# 从数据源开关/默认关闭
	enabled: true
	url: jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8
	username: root
	password: password
```

2、在需要使用多数据源方法或类上添加`@DS`注解，其中`value`用来表示数据源

```java
@DS(value = 'slave')
public List<SysUser> selectUserList(SysUser user) {
	return userMapper.selectUserList(user);
}
@Service
@DS(value = 'slave')
public class SysUserServiceImpl
```

对于特殊情况可以通过`DynamicDataSourceContextHolder`手动实现数据源切换

```java
public List<SysUser> selectUserList(SysUser user) {
	DynamicDataSourceContextHolder.setDataSourceType(DataSourceType.SLAVE.name());
	List<SysUser> userList = userMapper.selectUserList(user);
	DynamicDataSourceContextHolder.clearDataSourceType();
	return userList;
}
```

#### 扩展使用



- [可以参考官方文档： 动态参数解析数据源](https://github.com/baomidou/dynamic-datasource-spring-boot-starter/wiki/Dynamic-Analysis-DataSource)

```java
@DS("#session.tenantName")//从session获取
public List selectSpelBySession() {
   return userMapper.selectUsers();
}

@DS("#header.tenantName")//从header获取
public List selectSpelByHeader() {
   return userMapper.selectUsers();
}

@DS("#tenantName")//使用spel从参数获取
public List selectSpelByKey(String tenantName) {
   return userMapper.selectUsers();
}

@DS("#user.tenantName")//使用spel从复杂参数获取
public List selecSpelByTenant(User user) {
   return userMapper.selectUsers();
}
```

## 代码生成

大部分项目里其实有很多代码都是重复的，几乎每个基础模块的代码都有增删改查的功能，而这些功能都是大同小异， 如果这些功能都要自己去写，将会大大浪费我们的精力降低效率。所以这种重复性的代码可以使用代码生成。

::: tip

关于代码生成使用流程

:::

1、修改代码生成配置nacos配置中心

`author`:          # 开发者姓名，生成到类注释上

 `packageName`:     # 默认生成包路径

 `autoRemovePre`:   # 是否自动去除表前缀

 `tablePrefix`:     # 表前缀

2、新建数据库表结构（单表）

```sql
drop table if exists sys_student;
create table sys_student (
  student_id           int(11)         auto_increment    comment '编号',
  student_name         varchar(30)     default ''        comment '学生名称',
  student_age          int(3)          default null      comment '年龄',
  student_hobby        varchar(30)     default ''        comment '爱好（0代码 1音乐 2电影）',
  student_sex          char(1)         default '0'       comment '性别（0男 1女 2未知）',
  student_status       char(1)         default '0'       comment '状态（0正常 1停用）',
  student_birthday     datetime                          comment '生日',
  primary key (student_id)
) engine=innodb auto_increment=1 comment = '学生信息表';
```

2、新建数据库表结构（树表）

```sql
drop table if exists sys_product;
create table sys_product (
  product_id        bigint(20)      not null auto_increment    comment '产品id',
  parent_id         bigint(20)      default 0                  comment '父产品id',
  product_name      varchar(30)     default ''                 comment '产品名称',
  order_num         int(4)          default 0                  comment '显示顺序',
  status            char(1)         default '0'                comment '产品状态（0正常 1停用）',
  primary key (product_id)
) engine=innodb auto_increment=1 comment = '产品表';
```

2、新建数据库表结构（主子表）

```sql
-- ----------------------------
-- 客户表
-- ----------------------------
drop table if exists sys_customer;
create table sys_customer (
  customer_id           bigint(20)      not null auto_increment    comment '客户id',
  customer_name         varchar(30)     default ''                 comment '客户姓名',
  phonenumber           varchar(11)     default ''                 comment '手机号码',
  sex                   varchar(20)     default null               comment '客户性别',
  birthday              datetime                                   comment '客户生日',
  remark                varchar(500)    default null               comment '客户描述',
  primary key (customer_id)
) engine=innodb auto_increment=1 comment = '客户表';


-- ----------------------------
-- 商品表
-- ----------------------------
drop table if exists sys_goods;
create table sys_goods (
  goods_id           bigint(20)      not null auto_increment    comment '商品id',
  customer_id        bigint(20)      not null                   comment '客户id',
  name               varchar(30)     default ''                 comment '商品名称',
  weight             int(5)          default null               comment '商品重量',
  price              decimal(6,2)    default null               comment '商品价格',
  date               datetime                                   comment '商品时间',
  type               char(1)         default null               comment '商品种类',
  primary key (goods_id)
) engine=innodb auto_increment=1 comment = '商品表';
```

3、登录系统（工具箱 -> 代码生成 -> 导入对应表）

4、代码生成列表中找到需要表（可预览、修改、删除生成配置）

5、点击生成代码会得到一个`twelvet.zip`执行`sql`文件，按照包内目录结构复制到自己的项目中即可

##  定时任务

在实际项目开发中Web应用有一类不可缺少的，那就是定时任务。 定时任务的场景可以说非常广泛，比如某些视频网站，购买会员后，每天会给会员送成长值，每月会给会员送一些电影券； 比如在保证最终一致性的场景中，往往利用定时任务调度进行一些比对工作；比如一些定时需要生成的报表、邮件；比如一些需要定时清理数据的任务等。 所以我们提供方便友好的web界面，实现动态管理任务，可以达到动态控制定时任务启动、暂停、重启、删除、添加、修改等操作，极大地方便了开发过程。

提示

关于定时任务使用流程

1、后台添加定时任务处理类（支持`Bean`调用、`Class`类调用）
 `Bean`调用示例：需要添加对应`Bean`注解`@Component`或`@Service`。调用目标字符串：`twtTask.twtParams('twt')`
 `Class`类调用示例：添加类和方法指定包即可。调用目标字符串：`com.twelvet.server.job.task.TWTTask.twtParams('twt')`

```java
/**
 * @author twelvet
 * @WebSite www.twelvet.cn
 * @Description: 定时任务调度测试
 */
@Component("twtTask")
public class TWTTask {

    public void twtMultipleParams(String s, Boolean b, Long l, Double d, Integer i) {
        System.out.println(StringUtils.format("执行多参方法： 字符串类型{}，布尔类型{}，长整型{}，浮点型{}，整形{}", s, b, l, d, i));
    }

    public void twtParams(String params) {
        System.out.println("执行有参方法：" + params);
    }

    public void twtNoParams() {
        System.out.println("执行无参方法");
    }

}
```

2、前端新建定时任务信息（系统监控 -> 定时任务）
 任务名称：自定义，如：定时查询任务状态
 任务分组：根据字典`sys_job_group`配置
 调用目标字符串：设置后台任务方法名称参数
 执行表达式：可查询官方`cron`表达式介绍
 执行策略：定时任务自定义执行策略
 并发执行：是否需要多个任务间同时执行
 状态：是否启动定时任务
 备注：定时任务描述信息

3、点击执行一次，测试定时任务是否正常及调度日志是否正确记录，如正常执行表示任务配置成功。

执行策略详解：
 `立即执行`（所有`misfire`的任务会马上执行）打个比方，如果9点`misfire`了，在10：15系统恢复之后，9点，10点的`misfire`会马上执行
 `执行一次`（会合并部分的`misfire`，正常执行下一个周期的任务）假设9，10的任务都`misfire`了，系统在10：15分起来了。只会执行一次`misfire`，下次正点执行。
 `放弃执行`(所有的`misfire`不管，执行下一个周期的任务)

方法参数详解：
 `字符串`（需要单引号''标识 如：`twtTask.ryParams(’ry’)`）
 `布尔类型`（需要true false标识 如：`twtTask.ryParams(true)`）
 `长整型`（需要L标识 如：`twtTask.ryParams(2000L)`）
 `浮点型`（需要D标识 如：`twtTask.ryParams(316.50D)`）
 `整型`（纯数字即可）

cron表达式语法:
 [秒] [分] [小时] [日] [月] [周] [年]

| 说明 | 必填 | 允许填写的值   | 允许的通配符  |
| ---- | ---- | -------------- | ------------- |
| 秒   | 是   | 0-59           | , - * /       |
| 分   | 是   | 0-59           | , - * /       |
| 时   | 是   | 0-23           | , - * /       |
| 日   | 是   | 1-31           | , - * /       |
| 月   | 是   | 1-12 / JAN-DEC | , - * ? / L W |
| 周   | 是   | 1-7 or SUN-SAT | , - * ? / L # |
| 年   | 是   | 1970-2099      | , - * /       |

通配符说明:
 `*` 表示所有值。 例如:在分的字段上设置 *,表示每一分钟都会触发
 `?` 表示不指定值。使用的场景为不需要关心当前设置这个字段的值。例如:要在每月的10号触发一个操作，但不关心是周几，所以需要周位置的那个字段设置为”?” 具体设置为 0 0 0 10 * ?
 `-` 表示区间。例如 在小时上设置 “10-12”,表示 10,11,12点都会触发
 `,` 表示指定多个值，例如在周字段上设置 “MON,WED,FRI” 表示周一，周三和周五触发
 `/` 用于递增触发。如在秒上面设置”5/15” 表示从5秒开始，每增15秒触发(5,20,35,50)。 在月字段上设置’1/3’所示每月1号开始，每隔三天触发一次
 `L` 表示最后的意思。在日字段设置上，表示当月的最后一天(依据当前月份，如果是二月还会依据是否是润年[leap]),  在周字段上表示星期六，相当于”7”或”SAT”。如果在”L”前加上数字，则表示该数据的最后一个。例如在周字段上设置”6L”这样的格式,则表示“本月最后一个星期五”
 `W` 表示离指定日期的最近那个工作日(周一至周五).  例如在日字段上置”15W”，表示离每月15号最近的那个工作日触发。如果15号正好是周六，则找最近的周五(14号)触发,  如果15号是周未，则找最近的下周一(16号)触发.如果15号正好在工作日(周一至周五)，则就在该天触发。如果指定格式为  “1W”,它则表示每月1号往后最近的工作日触发。如果1号正是周六，则将在3号下周一触发。(注，”W”前只能设置具体的数字,不允许区间”-“)
 `#`  序号(表示每月的第几个周几)，例如在周字段上设置”6#3”表示在每月的第三个周六.注意如果指定”#5”,正好第五周没有周六，则不会触发该配置(用在母亲节和父亲节再合适不过了) ；小提示：’L’和  ‘W’可以一组合使用。如果在日字段上设置”LW”,则表示在本月的最后一个工作日触发；周字段的设置，若使用英文字母是不区分大小写的，即MON与mon相同

常用表达式例子:

| 表达式                   | 说明                                                    |
| ------------------------ | ------------------------------------------------------- |
| 0 0 2 1 * ? *            | 表示在每月的1日的凌晨2点调整任务                        |
| 0 15 10 ? * MON-FRI      | 表示周一到周五每天上午10:15执行作业                     |
| 0 15 10 ? 6L 2002-2006   | 表示2002-2006年的每个月的最后一个星期五上午10:15执行作  |
| 0 0 10,14,16 * * ?       | 每天上午10点，下午2点，4点                              |
| 0 0/30 9-17 * * ?        | 朝九晚五工作时间内每半小时                              |
| 0 0 12 ? * WED           | 表示每个星期三中午12点                                  |
| 0 0 12 * * ?             | 每天中午12点触发                                        |
| 0 15 10 ? * *            | 每天上午10:15触发                                       |
| 0 15 10 * * ?            | 每天上午10:15触发                                       |
| 0 15 10 * * ? *          | 每天上午10:15触发                                       |
| 0 15 10 * * ? 2005       | 2005年的每天上午10:15触发                               |
| 0 * 14 * * ?             | 在每天下午2点到下午2:59期间的每1分钟触发                |
| 0 0/5 14 * * ?           | 在每天下午2点到下午2:55期间的每5分钟触发                |
| 0 0/5 14,18 * * ?        | 在每天下午2点到2:55期间和下午6点到6:55期间的每5分钟触发 |
| 0 0-5 14 * * ?           | 在每天下午2点到下午2:05期间的每1分钟触发                |
| 0 10,44 14 ? 3 WED       | 每年三月的星期三的下午2:10和2:44触发                    |
| 0 15 10 ? * MON-FRI      | 周一至周五的上午10:15触发                               |
| 0 15 10 15 * ?           | 每月15日上午10:15触发                                   |
| 0 15 10 L * ?            | 每月最后一日的上午10:15触发                             |
| 0 15 10 ? * 6L           | 每月的最后一个星期五上午10:15触发                       |
| 0 15 10 ? * 6L 2002-2005 | 2002年至2005年的每月的最后一个星期五上午10:15触发       |
| 0 15 10 ? * 6#3          | 每月的第三个星期五上午10:15触发                         |

所有定时任务的相关业务逻辑代码在`twelvet-server-quartz`模块，可以自行调整或剔除

```
注意：不同数据源定时任务都有对应脚本，Oracle、Mysql已经有了，其他的可自行下载执行
```

## Swagger接口文档

1、在控制层`Controller`中添加注解来描述接口信息如:

```java
@Api("参数配置")
@Controller
@RequestMapping("/system/config")
public class ConfigController
```

2、在方法中配置接口的标题信息

```sql
@ApiOperation("查询参数列表")
@ResponseBody
public TableDataInfo list(Config config) {
	startPage();
	List<Config> list = configService.selectConfigList(config);
	return getDataTable(list);
}
```

3、在`系统工具-系统接口`测试相关接口

```
注意：SwaggerConfig可以指定根据注解或者包名扫描具体的API
```

API详细说明

| 作用范围           | API                | 使用位置                         |
| ------------------ | ------------------ | -------------------------------- |
| 协议集描述         | @Api               | 用于controller类上               |
| 对象属性           | @ApiModelProperty  | 用在出入参数对象的字段上         |
| 协议描述           | @ApiOperation      | 用在controller的方法上           |
| Response集         | @ApiResponses      | 用在controller的方法上           |
| Response           | @ApiResponse       | 用在 @ApiResponses里边           |
| 非对象参数集       | @ApiImplicitParams | 用在controller的方法上           |
| 非对象参数描述     | @ApiImplicitParam  | 用在@ApiImplicitParams的方法里边 |
| 描述返回对象的意义 | @ApiModel          | 用在返回对象类上                 |

`api`标记，用在类上，说明该类的作用。可以标记一个`Controller`类做为`Swagger`文档资源，使用方式：

```java
@Api(value = "/user", description = "用户管理")
```

与`Controller`注解并列使用。 属性配置：

| 属性名称       | 备注                                             |
| -------------- | ------------------------------------------------ |
| value          | url的路径值                                      |
| tags           | 如果设置这个值、value的值会被覆盖                |
| description    | 对api资源的描述                                  |
| basePath       | 基本路径可以不配置                               |
| position       | 如果配置多个Api 想改变显示的顺序位置             |
| produces       | For example, "application/json, application/xml" |
| consumes       | For example, "application/json, application/xml" |
| protocols      | Possible values: http, https, ws, wss.           |
| authorizations | 高级特性认证时配置                               |
| hidden         | 配置为true 将在文档中隐藏                        |

`ApiOperation`标记，用在方法上，说明方法的作用，每一个`url`资源的定义,使用方式：

```java
@ApiOperation("获取用户信息")
```

与`Controller`中的方法并列使用，属性配置：

| 属性名称          | 备注                                                         |
| ----------------- | ------------------------------------------------------------ |
| value             | url的路径值                                                  |
| tags              | 如果设置这个值、value的值会被覆盖                            |
| description       | 对api资源的描述                                              |
| basePath          | 基本路径可以不配置                                           |
| position          | 如果配置多个Api 想改变显示的顺序位置                         |
| produces          | For example, "application/json, application/xml"             |
| consumes          | For example, "application/json, application/xml"             |
| protocols         | Possible values: http, https, ws, wss.                       |
| authorizations    | 高级特性认证时配置                                           |
| hidden            | 配置为true将在文档中隐藏                                     |
| response          | 返回的对象                                                   |
| responseContainer | 这些对象是有效的 "List", "Set" or "Map".，其他无效           |
| httpMethod        | "GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS" and "PATCH" |
| code              | http的状态码 默认 200                                        |
| extensions        | 扩展属性                                                     |

`ApiParam`标记，请求属性，使用方式：

```java
public TableDataInfo list(@ApiParam(value = "查询用户列表", required = true)User user)
```

与Controller中的方法并列使用，属性配置：

| 属性名称        | 备注         |
| --------------- | ------------ |
| name            | 属性名称     |
| value           | 属性值       |
| defaultValue    | 默认属性值   |
| allowableValues | 可以不配置   |
| required        | 是否属性必填 |
| access          | 不过多描述   |
| allowMultiple   | 默认为false  |
| hidden          | 隐藏该属性   |
| example         | 举例子       |

`ApiResponse`标记，响应配置，使用方式：

```java
@ApiResponse(code = 400, message = "查询用户失败")
```

与`Controller`中的方法并列使用，属性配置：

| 属性名称          | 备注                             |
| ----------------- | -------------------------------- |
| code              | http的状态码                     |
| message           | 描述                             |
| response          | 默认响应类 Void                  |
| reference         | 参考ApiOperation中配置           |
| responseHeaders   | 参考 ResponseHeader 属性配置说明 |
| responseContainer | 参考ApiOperation中配置           |

`ApiResponses`标记，响应集配置，使用方式:

```java
@ApiResponses({ @ApiResponse(code = 400, message = "无效的用户") })
```

与`Controller`中的方法并列使用，属性配置：

| 属性名称 | 备注                |
| -------- | ------------------- |
| value    | 多个ApiResponse配置 |

`ResponseHeader`标记，响应头设置，使用方法

```java
@ResponseHeader(name="head",description="响应头设计")
```

与`Controller`中的方法并列使用，属性配置：

| 属性名称          | 备注                   |
| ----------------- | ---------------------- |
| name              | 响应头名称             |
| description       | 描述                   |
| response          | 默认响应类 void        |
| responseContainer | 参考ApiOperation中配置 |

## 国际化支持

### 后台国际化流程

1、修改`I18nConfig`设置默认语言，如默认`中文`：

```java
/**
 * @author twelvet
 * @WebSite www.twelvet.cn
 * @Description: 配置默认语言
 */
@Configuration
public class MyLocaleResolver implements LocaleResolver {
    @Override
    public Locale resolveLocale(HttpServletRequest httpServletRequest) {
        String l = httpServletRequest.getParameter("l");
        if (StringUtils.isEmpty(l)) {
            Locale locale = Locale.getDefault();
            return locale;
        } else {
            String[] split = l.split("_");
            return new Locale(split[0], split[1]);
        }
    }
}
```

2、修改配置`twelvet-xxx-dev.yml`中的`basename`国际化文件，默认是`i18n`路径下`messages`文件
 （比如现在国际化文件是`xx_zh_CN.properties`、`xx_en_US.properties`，那么`basename`配置应为是`i18n/xx`

```yml
spring:
  # 资源信息
  messages:
    # 国际化资源文件路径
    basename: static/i18n/messages
```

3、`i18n`目录文件下定义资源文件
 美式英语 `messages_en_US.properties`

```properties
user.login.username=User name
user.login.password=Password
user.login.code=Security code
user.login.remember=Remember me
user.login.submit=Sign In
```

中文简体 `messages_zh_CN.properties`

```properties
user.login.username=用户名
user.login.password=密码
user.login.code=验证码
user.login.remember=记住我
user.login.submit=登录
```

4、java代码使用`MessageUtils`获取国际化

```java
MessageUtils.message("user.login.username")
MessageUtils.message("user.login.password")
MessageUtils.message("user.login.code")
MessageUtils.message("user.login.remember")
MessageUtils.message("user.login.submit")
```

### 前端国际化流程

[参考Antd Pro](https://pro.ant.design/docs/i18n-cn#gatsby-focus-wrapper)

## 新建服务

Maven多模块下新建子模块流程案例。

1、在`twelvet-server`下新建业务模块目录，例如：`twelvet-server-test`。

参数twelvet-server-test`业务模块下新建`pom.xml`文件以及`src\main\java`，`src\main\resources`目录。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xmlns="http://maven.apache.org/POM/4.0.0"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <groupId>com.twelvet</groupId>
        <artifactId>twelvet-server</artifactId>
        <version>x.x.x</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>
	
    <artifactId>twelvet-server-test</artifactId>

    <description>
        twelvet-server-test系统模块
    </description>
	
    <dependencies>
    	
    	<!--默认采用多数据-->
        <dependency>
            <groupId>com.twelvet</groupId>
            <artifactId>twelvet-framework-datasource</artifactId>
        </dependency>
        
    </dependencies>
   
</project>
```

3、在`twelvet-server`目录下`pom.xml`模块节点modules添加业务模块

```xml
<module>twelvet-server-test</module>
```

4、`src/main/resources`添加`bootstrap.yml`文件

```yml
# Tomcat
server:
  port: 8096

# Spring
spring:
  application:
    # 应用名称
    name: @artifactId@
  profiles:
    # 环境配置
    active: @profiles.active@
  cloud:
    nacos:
      discovery:
        # 解决获取IP为内网，一般微服务采用内网安全性、可用性高
        ip: 127.0.0.1
        # 服务注册地址
        server-addr: ${NACOS_HOST:127.0.0.1}:${NACOS_PORT:8848}
        namespace: eeb43899-8a88-4f5b-b0e0-d7c8fd09b86e
      config:
        # 配置中心地址
        server-addr: ${spring.cloud.nacos.discovery.server-addr}
        # 配置文件格式
        file-extension: yml
        # 命名空间
        namespace: eeb43899-8a88-4f5b-b0e0-d7c8fd09b86e
        # 配置组
        group: DEFAULT_GROUP
        # 共享配置
        shared-configs: twelvet-app-${spring.profiles.active}.${spring.cloud.nacos.config.file-extension}
```

5、com.twelvet.server.test包下添加启动类

```java
package com.twelvet;

import com.twelvet.framework.core.annotation.EnableTWTFeignClients;
import com.twelvet.framework.core.annotation.EnableTwelveTConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


/**
 * @author twelvet
 * @WebSite www.twelvet.cn
 * @Description: 启动程序
 * @EnableFeignClients 开启服务扫描
 */
@EnableTwelveTConfig
@EnableTWTFeignClients
@SpringBootApplication
public class TWTTestApp {

    public static void main(String[] args) {
        SpringApplication.run(TWTTestApp.class, args);
    }

}
```