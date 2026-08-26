# Q-series 无名杀

这是 Q-series 的 Cloudflare Pages 静态发布仓库。

站点内容位于 `public/`，包含：

- Q-series：Agnes、La Maupin、熊姆姆、心祥、Barbin；
- 标准与神话再临武将（精简版不含左慈）；
- 标准与军争卡牌；
- 身份、对决、斗地主模式。

## Cloudflare Pages 设置

- Production branch：`main`
- Framework preset：None
- Build command：留空
- Build output directory：`public`
- Root directory：仓库根目录

后续版本应在源码仓库运行 `pnpm build:q-web`，再用新的 `dist-q/` 完整替换本仓库的 `public/`。

上游游戏：[libnoname/noname](https://github.com/libnoname/noname)
