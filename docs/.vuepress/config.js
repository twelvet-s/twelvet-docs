const moment = require('moment');


module.exports = {
    title: 'TwelveT',
    base: '/docs/',
    plugins: {
        // 更新时间
        '@vuepress/last-updated': {
            transformer: (timestamp, lang) => {
                moment.locale(lang)
                return moment(timestamp).fromNow()
            }
        },
        // 返回顶部
        '@vuepress/back-to-top': {},
        '@vuepress/medium-zoom': {},
        // 自动目录
        'vuepress-plugin-auto-sidebar': {
            title: {
                mode: "default",
                map: {
                    "/twelvet/": "微服务",
                }
            },
        }
    },
    head: [
        ['link', { rel: 'icon', href: '/assets/favicon.ico' }],
        ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1,user-scalable=no' }]
    ],
    description: '跟随 TwelveT 探索微服务开发',
    head: [
        ['link', { rel: 'icon', href: "/assets/favicon.ico" }]
    ],
    themeConfig: {
        lastUpdated: '最后更新时间',
        nav: [
            { text: '微服务', link: '/twelvet/' },
            {
                text: '关于我们',
                ariaLabel: 'About',
                items: [
                    {
                        items: [
                            { text: 'GitHub', link: 'https://github.com/twelvet-s/twelvet' },
                            { text: 'Gitee', link: 'https://gitee.com/twelvet/twelvet' },
                            { text: '官网', link: 'https://www.twelvet.cn/' },
                            { text: 'QQ群', link: 'https://jq.qq.com/?_wv=1027&k=cznM6Q00' },
                        ]
                    },
                ]
            }
        ],
        // 评论
        // vssueConfig: {
        //     platform: 'github',
        //     owner: 'OWNER_OF_REPO',
        //     repo: 'NAME_OF_REPO',
        //     clientId: 'YOUR_CLIENT_ID',
        //     clientSecret: 'YOUR_CLIENT_SECRET',
        // },
        // 项目开始时间，只填写年份
        docsRepo: 'twelvet-s/twelvet',
        editLinkText: '帮助我们改善此页面！',
        startYear: '2019',
        friendLink: [
            {
                title: 'TwelveT',
                desc: '官方博客',
                logo: "https://www.twelvet.cn/template/twelvet/logo.png",
                link: 'https://www.twelvet.cn#docs'
            },
        ],
        codeTheme: 'OKAIDIA',
    }
}