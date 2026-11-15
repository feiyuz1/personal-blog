export interface ExpertiseItem {
  /** 能力项，例如「几何建模」 */
  label: string;
  /** 该能力项下的具体技术点 */
  skills: string[];
}

export interface ExpertiseGroup {
  title?: string;
  items: ExpertiseItem[];
}

export interface ExpertiseDomain {
  id: "graphics" | "application" | "toolchain";
  index: string;
  title: string;
  /** 该领域的主要开发平台 */
  platform?: string;
  groups: ExpertiseGroup[];
}

/**
 * 技术专长属于固定的展示型内容，没有后台编辑需求，
 * 因此直接维护在代码里，避免为静态数据引入内容块表。
 */
export const techExpertise: ExpertiseDomain[] = [
  {
    id: "graphics",
    index: "01",
    title: "三维图形开发",
    platform: "Unreal Engine 5",
    groups: [
      {
        title: "建模与几何处理",
        items: [
          {
            label: "几何建模",
            skills: ["参数化建模", "几何布尔运算"],
          },
          {
            label: "几何处理",
            skills: ["三角网格处理", "模型简化", "网格合并与几何优化"],
          },
          {
            label: "空间数据结构",
            skills: ["BVH", "KD-Tree"],
          },
          {
            label: "三维数据处理",
            skills: ["CAD/BIM 数据解析", "模型格式转换与三维资产处理"],
          },
        ],
      },
      {
        title: "渲染技术",
        items: [
          {
            label: "渲染管线",
            skills: ["前向渲染", "延迟渲染"],
          },
          {
            label: "GPU 编程",
            skills: ["Shader 编程", "GPU 资源管理", "Vulkan"],
          },
          {
            label: "高斯泼溅渲染",
            skills: ["3D Gaussian Splatting（3DGS）"],
          },
          {
            label: "调试与性能分析",
            skills: [
              "RenderDoc",
              "Unreal Insights",
              "UE Stat 系列",
              "GPU Visualizer",
            ],
          },
        ],
      },
      {
        title: "动画系统",
        items: [
          {
            label: "动画技术",
            skills: ["关键帧动画", "时间轴系统", "动画状态控制", "事件调度"],
          },
        ],
      },
      {
        title: "图形交互与可视化",
        items: [
          {
            label: "三维交互",
            skills: ["对象拾取", "空间交互", "场景编辑与属性查询"],
          },
          {
            label: "场景组织与展示",
            skills: ["多源模型组织", "图层管理", "场景展示与可视化表达"],
          },
          {
            label: "交互式编辑",
            skills: ["材质编辑", "对象显隐与运行时编辑工具"],
          },
        ],
      },
    ],
  },
  {
    id: "application",
    index: "02",
    title: "应用开发",
    groups: [
      {
        items: [
          {
            label: "桌面应用开发",
            skills: ["Qt"],
          },
          {
            label: "并发编程",
            skills: ["多线程", "异步处理"],
          },
          {
            label: "网络通信",
            skills: ["HTTP", "Socket", "gRPC", "Protocol Buffers"],
          },
        ],
      },
    ],
  },
  {
    id: "toolchain",
    index: "03",
    title: "编程语言与开发工具",
    groups: [
      {
        items: [
          {
            label: "编程语言",
            skills: ["C++11/14/17/21", "HLSL"],
          },
          {
            label: "开发环境",
            skills: ["Visual Studio", "Visual Studio Code"],
          },
          {
            label: "构建工具",
            skills: ["CMake"],
          },
          {
            label: "版本控制",
            skills: ["Git", "SVN"],
          },
        ],
      },
    ],
  },
];
