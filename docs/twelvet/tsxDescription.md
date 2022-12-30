---
order: 5
---

# 前端手册

## 开发规范

### 新增 view

在 [@/src/pages](https://gitee.com/y_project/twelvet/tree/master/twelvet-ui/src/pages) 文件下 创建对应的模块文件，一般一个路由对应一个文件， 该模块下的功能就建议在本文件夹下创建一个新文件夹，各个功能模块维护自己的`api`、`utils`或`components`组件。



### 新增组件

在全局的 [@/src/components](https://github.com/twelvet-s/twelvet/tree/master/twelvet-ui/src/components) 写一些全局的组件，如富文本，各种搜索组件，封装的分页组件等等能被公用的组件。

每个页面或者模块特定的业务组件则会写在当前 [@/src/pages/xxx](https://github.com/twelvet-s/twelvet/tree/master/twelvet-ui/src/pages) 下面。
 如：`@/src/pages/system/user/components/xxx.tsx`。这样拆分大大减轻了维护成本。



### 新增样式

页面的样式和组件是一个道理，全局的 [@/src/global.less](https://github.com/twelvet-s/twelvet/tree/master/twelvet-ui/src/global.less) 放置一下全局公用的样式，每一个页面的样式就写在当前 `views`下面，请记住加上`scoped` 就只会作用在当前组件内了，避免造成全局的样式污染。

```css
@import '~antd/es/style/themes/default.less';

// 兼容IE11
@media screen and(-ms-high-contrast: active), (-ms-high-contrast: none) {
  body .ant-design-pro > .ant-layout {
    min-height: 100vh;
  }
}

// 修改antd Table默认为居中(依然可以使用columns的config进行配置)
.ant-table-content .ant-table-thead > tr > th, .ant-table-cell {text-align: center}

a:hover{
  color: #588fc1;
}
```

## 请求流程

### 交互流程

一个完整的前端 UI 交互到服务端处理流程是这样的：

1. UI 组件交互操作；
2. 调用 api service 请求函数；
3. 使用封装的 request.js 发送请求；
4. 获取服务端返回；
5. 更新 data；

::: tip 提示

其中，[@/src/utils/request.js](https://gitee.com/y_project/twelvet/blob/master/twelvet-ui/src/utils/request.js) 是基于 axios 的封装，便于统一处理 POST，GET 等请求参数，请求头，以及错误提示信息等。 它封装了全局 request拦截器、response拦截器、统一的错误处理、统一做了超时处理、baseURL设置等。

:::

### 请求示例

```typescript
import request, { download, upload } from '@/utils/request'

// 请求的控制器名称
const controller = "/system/user";

/**
 * 新增职员
 * @param params 搜索参数
 */
export async function insert(params: { [key: string]: any }) {
    return request(`${controller}`, {
        method: 'POST',
        data: {
            ...params
        },
    });
}

// /src/pages/human/staff/server.ts
import { insert } from './service'

/**
 * 保存数据
 */
const onSave = () => {
    form
        .validateFields()
        .then(
        async (fields) => {
            try {
                // 开启加载中
                setLoadingModal(true)
                // ID为0则insert，否则将update
                const { code, msg } = fields.userId == 0 ? await insert(fields) : await update(fields)
                if (code != 200) {
                    return message.error(msg)
                }

                message.success(msg)

                if (acForm.current) {
                    acForm.current.reload()
                }

                // 关闭模态框
                handleCancel()
            } catch (e) {
                system.error(e)
            } finally {
                setLoadingModal(false)
            }
        }).catch(e => {
        system.error(e)
    })
}
```

## 引入依赖

除了 antd 组件以及脚手架内置的业务组件，有时我们还需要引入其他外部组件，这里以引入 [echarts](https://echarts.apache.org) 为例进行介绍。

在终端输入下面的命令完成安装：

```bash
$ yarn add echarts
```



## 多级目录

默认采用约定式路由，需要多级目录创建对应的文件夹即可。



## 使用图标

 antd官方提供了一下简单icon给予我们使用。

但是当复杂的时候我们就需要集成到[iconfont](https://www.iconfont.cn/)，进入官网，登录账号 ---> 选择喜欢的icon ---> 上传到我们的iconfont中，获取js保存到本地@/public/js/icon.js即可调用，详细请看[官方集成icon](https://ant.design/components/icon-cn/#components-icon-demo-scriptUrl)



## 使用字典

字典管理是用来维护数据类型的数据，如下拉框、单选按钮、复选框、树选择的数据，方便系统管理员维护。主要功能包括：字典分类管理、字典数据管理

1、页面使用数据字典

```tsx
import DictionariesSelect from '@/components/TwelveT/Dictionaries/DictionariesSelect/Index'

<DictionariesSelect type='sys_oauth_client_details' />
```



## 异常处理

`@/utils/request.js` 是基于 `axios` 的封装，便于统一处理 POST，GET 等请求参数，请求头，以及错误提示信息等。它封装了全局 `request拦截器`、`response拦截器`、`统一的错误处理`、`统一做了超时处理`、`baseURL设置等`。 如果有自定义错误码可以在`codeMessage`中设置对应`key` `value`值。

```tsx
/**
 * request 网络请求工具
 * 更详细的 api 文档: https://github.com/umijs/umi-request
 */
import { extend } from 'umi-request'
import { message, notification } from 'antd'
import { getDvaApp } from 'umi'
import { system } from '@/utils/twelvet'
import TWT from '@/setting'
import { isArray } from 'lodash'
import { logout } from '@/utils/twelvet'


const codeMessage = {
    200: '服务器成功返回请求的数据。',
    201: '新建或修改数据成功。',
    202: '一个请求已经进入后台排队（异步任务）。',
    204: '删除数据成功。',
    400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
    401: '用户没有权限（令牌、用户名、密码错误/失效）。',
    403: '用户得到授权，但是访问是被禁止的。',
    404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
    406: '请求的格式不可得。',
    410: '请求的资源被永久删除，且不会再得到的。',
    422: '当创建一个对象时，发生一个验证错误。',
    500: '服务器发生错误，请检查服务器。',
    502: '网关错误。',
    503: '服务不可用，服务器暂时过载或维护。',
    504: '网关超时。',
}

/**
 * 异常处理程序
 */
const errorHandler = async (error: { response: Response }): Promise<Response> => {
    const { response } = error

    if (response && response.status) {
        const errorText = codeMessage[response.status] || response.statusText
        const { status, url } = response

        notification.error({
            message: `请求错误 ${status}: ${url}`,
            description: errorText,
        })

    } else if (!response) {
        notification.error({
            description: '您的网络发生异常，无法连接服务器',
            message: '网络异常',
        });
        logout()
    }
    return response
}

/**
 * 配置request请求时的默认参数
 */
const request = extend({
    // 默认错误处理
    errorHandler,
    // 超时时间（毫秒）
    timeout: 15000,
    // 默认请求是否带上cookie(配置后无法跨域)
    // credentials: 'include',
})

// 请求前的处理
request.use(
    async (ctx, next) => {
        try {
            const { req } = ctx
            const { url, options } = req

            if (url.indexOf('http') && (url.indexOf('/api') !== 0)) {
                // 给url添加前缀
                ctx.req.url = `${TWT.urlPrefix}${url}`
            }

            // 统一传递的参数名称【get请求时参数传递需要放到params下】
            const _method: string = options.method?.toLocaleUpperCase()
            if (_method == 'GET' && options.data) {
                options.params = {
                    ...options.data
                }
            }

            const local = localStorage.getItem(TWT.accessToken)
            const { access_token, expires_in } = local ? JSON.parse(local) : { access_token: '', expires_in: 0 }

            // 附加参数
            ctx.req.options = {
                ...options,
                requestPath: url,
                headers: {
                    ...options.headers,
                    // 加入认证信息
                    'Authorization': `Bearer ${access_token}`
                }
            }

            await next()
        } catch (e) {
            system.error(e)
        }
    }
)


// Filter【请求后的处理】
request.interceptors.response.use(async (httpResponse, httpRequest) => {

    if(httpResponse.status === 504){
        notification.error({
            description: '服务异常,无法连接',
            message: codeMessage[504],
        });
        throw new Error(codeMessage[504])
    }

    // blob类型直接返回
    if (httpRequest.responseType === 'blob' && httpResponse.status == 200) {
        return httpResponse;
    }

    const data = await httpResponse.clone().json();

    // 默认返回
    let responseRes = httpResponse

    // 处理401状态
    if (data.code === 401) {
        const { params, method, requestPath } = httpRequest
        // 执行刷新token
        const res = await getDvaApp()._store.dispatch({
            type: 'user/refreshToken',
            payload: {
                requestPath: requestPath,
                method: method,
                responseType: httpRequest.responseType,
                data: params
            }
        })

        // 存在返回再设置
        if (res) {
            responseRes = res
        }

    }

    if (data && data.code === 403) {
        notification.error({
            message: data.msg,
        });
        // 跳转到登陆页
        // return router.replace('/user/login');
    } else if (data && data.status === -998) {
        // 无操作权限
        notification.error({
            message: data.msg
        });
    }

    return responseRes;

})

/**
 * 通用下载方法
 * @param url 地址
 * @param params 参数
 * @param filename 文件名称(空即为输出默认)
 */
export function download(url: string, params?: { [key: string]: any }, filename?: string) {
    return request(`${url}`, {
        method: 'POST',
        data: {
            ...params
        },
        params: {
            refresh: new Date().getTime()
        },
        responseType: 'blob',
        parseResponse: false
    })
        .then((response) => {

            // 空的将采用默认
            if (!filename) {

                const contentDisposition = response.headers.get('content-disposition')
                if (!contentDisposition) {
                    return response.blob()
                }
                const name = contentDisposition.split("filename=")
                if (isArray(name)) {
                    // 获取并还原编码
                    filename = decodeURIComponent(name[1])
                } else {
                    filename = 'unknown'
                }
            }

            return response.blob()

        })
        .then((blob) => {
            if ('download' in document.createElement('a')) {
                // 非IE下载
                const elink = document.createElement('a')
                elink.download = filename || 'unknown'
                elink.style.display = 'none'
                elink.href = URL.createObjectURL(blob)
                document.body.appendChild(elink)
                elink.click()
                URL.revokeObjectURL(elink.href)
                document.body.removeChild(elink)
            } else {
                // IE10+下载
                navigator.msSaveBlob(blob, filename)
            }
        }).catch((r) => {
            system.error(r)
        })
}

/**
 * 通用文件上传
 * @param url 地址
 * @param formData 数据对象 FormData
 * @param params 参数
 */
export function upload(url: string, formData: FormData) {
    return request(`${url}`, {
        method: 'POST',
        requestType: 'form',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': '*/*',
        },
        data: formData,
    })
}

export default request
```



## 应用路径

有些特殊情况需要部署到子路径下，例如：`https://www.twelvet.cn/admin`，可以按照下面流程修改。

修改`@/config/config.ts`中的`manifest`属性

```tsx
manifest: {
    basePath: '/',
},
```



2、修改`nginx`配置

```text
location /admin {
	alias   /home/twelvet/projects/twelvet-ui;
	try_files $uri $uri/ /index.html =404;
	index  index.html index.htm;
}
```

打开浏览器，输入：`https://www.twelvet.cn/admin` 能正常访问和刷新表示成功。