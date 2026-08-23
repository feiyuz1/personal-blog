# Live2D 宠物集成

网站通过 `live2d-widgets` 加载 Live2D 模型。当前使用的模型入口是：

```text
public/pet/pachan 2.0/pachirisu anime girl - top half.model3.json
```

模型加载失败时会显示一个轻量状态入口，不再显示原来的小羽素材。

组件从 `public/live2d/widget/` 加载固定版本 `live2d-widgets@1.0.1` 的浏览器分发
文件。npm 包的模块入口包含未解析的 Cubism 5 内部别名，因此没有让 Next.js 直接
打包它，而是采用上游 README 推荐的 `waifu-tips.js` + `waifu.css` 接入方式。

本地 `chunk/index2.js` 将 Cubism 示例原本不受限制的全局鼠标跟随改成了有限视线
跟随：鼠标进入画布外扩 280px 的范围才响应，约 30 FPS 更新，限制转动幅度，并在
停止移动 900ms 后回正。隐藏角色或系统开启“减少动态效果”时不会跟随；组件配置仍
关闭位置拖拽。修改记录和许可证见 `public/live2d/widget/README.md` 与
`public/live2d/widget/LICENSE`。

角色位置拖拽由 `Live2DPet` 使用 Pointer Events 单独实现，因此同时支持鼠标和触屏。
拖动范围会限制在当前视口内，最终位置保存在浏览器 `localStorage` 的
`live2d-pet-position` 键中；窗口尺寸变化时会重新限制位置。拖动结束后的合成点击会
被忽略，不会误弹对话。

模型配置引用了 `expressions/` 下的 6 个 Cubism 表情预设。有效点击会从害羞、开心、
惊讶、委屈和调皮中随机选择且避免连续重复，再通过 `live2d:expression` 的事件详情
通知运行时播放同名表情。每种表情在 `Live2DPet` 中配置了 4 句对应台词，并使用独立
气泡避免被组件的欢迎语和定时提示覆盖。表情 3.2 秒后平滑切回中性，气泡显示 4 秒。
预设不修改眼睛开合参数，因此自动眨眼仍然有效。

由于当前 Pachan 模型没有 Cubism `HitAreas`，组件在点击 Live2D 画布时主动派发
`live2d:tapbody` 事件，让角色无需额外动作素材也能随机显示 `tapBody` 对话。

## 当前模型文件

模型文件必须保持当前相对路径：

```text
public/pet/pachan 2.0/
├── pachirisu anime girl - top half.model3.json
├── pachirisu anime girl - top half.moc3
├── pachirisu anime girl - top half.physics3.json
├── pachirisu anime girl - top half.cdi3.json
├── expressions/
│   ├── neutral.exp3.json
│   ├── shy.exp3.json
│   ├── happy.exp3.json
│   ├── surprised.exp3.json
│   ├── pout.exp3.json
│   └── playful.exp3.json
└── pachirisu anime girl - top half.4096/
    └── texture_00.png
```

当前素材没有 `.motion3.json` 动作文件，因此可以进行参数跟随、眨眼和物理摆动，
但不能播放单独的 `Idle` 或 `TapBody` 动作。模型配置中已补充 EyeBlink 和 LipSync
参数组。

如果以后更换模型入口，需要同时修改：

- `src/components/site/live2d-pet.tsx` 中的 `MODEL_PATH`
- `public/live2d/waifu-tips.json` 中的模型 `paths`

## Cubism Core

默认从 Live2D 官方地址加载 Cubism Core。生产环境若需要自行托管，可在获得并遵守
Live2D 许可的前提下设置：

```env
NEXT_PUBLIC_LIVE2D_CUBISM_CORE_URL=/live2d/core/live2dcubismcore.min.js
```

如果以后需要改用其他 `live2d-widget` 浏览器分发目录，可设置：

```env
NEXT_PUBLIC_LIVE2D_WIDGET_BASE_URL=/vendor/live2d-widget/
```

`live2d-widgets` 使用 GPL-3.0-or-later；Cubism Core、Cubism Framework 和模型素材
分别适用各自的许可证。当前 Pachan 素材目录没有附带许可证文件，公开使用前应确认
素材来源及网站部署权限。
