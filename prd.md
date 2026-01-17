# FlowState

**Realtime Dynamic NFT Social Protocol on Monad**

---

## 1. 产品背景（Background）

当前主流 Web3 社交协议（如 Lens、Farcaster）存在以下问题：

* 用户社交身份（NFT / Profile）**静态或低频更新**
* 大量交互数据依赖 **链下 indexer / hub**
* 链上互动成本高，**无法支持高频社交行为**
* 用户“活跃度”与“身份形象”脱钩

随着 Monad 提供 **高吞吐、低延迟、并行执行的 EVM 环境**，首次具备在 **链上实现实时社交反馈** 的可能性。

---

## 2. 产品目标（Goals）

### 核心目标

> 构建一个 **完全链上、实时进化的 NFT 社交身份系统**

### 具体目标

1. 用户拥有一个 **动态演化的 NFT 头像**
2. NFT 状态 **每分钟基于链上行为自动更新**
3. 支持 **高频、小额、低延迟** 的社交互动（点赞 / 打赏）
4. 展示 Monad 在 **实时链上应用** 场景下的技术优势

---

## 3. 核心概念（Key Concepts）

### 3.1 FlowNFT（动态社交 NFT）

* 每个用户铸造一个 FlowNFT
* FlowNFT 的 metadata **不固定**
* NFT 外观由最近的链上行为实时决定

---

### 3.2 FlowState（行为状态）

FlowNFT 的状态由一个滑动时间窗口内的行为计算得出：

| 行为类型  | 说明               |
| ----- | ---------------- |
| 交易活跃度 | 近 1 分钟内交互次数      |
| 点赞数   | 收到 / 发出的点赞       |
| 打赏数   | 收到 / 发出的 tip     |
| 转账频率  | NFT / Token 转移行为 |

---

### 3.3 实时窗口机制（Rolling Window）

* 使用 **1 分钟 Epoch**
* 状态仅统计：

  * 当前 Epoch
  * 上一个 Epoch
* 无需链下定时器
* 无需历史清理

---

## 4. 功能需求（Functional Requirements）

### 4.1 FlowNFT 铸造

**描述**
用户可铸造一个 FlowNFT 作为其社交身份。

**需求**

* 每个地址仅能持有 1 个 FlowNFT
* NFT 不可转移（或转移后状态清零）

**验收标准**

* 铸造成功后可立即参与互动
* NFT ID 与地址一一对应

---

### 4.2 行为记录（On-chain Activity Tracking）

#### 支持的行为

| 行为          | 触发状态变化 |
| ----------- | ------ |
| Like        | 是      |
| Tip         | 是      |
| Comment（可选） | 是      |

**需求**

* 所有行为均为 **链上交易**
* 每次行为更新当前 Epoch 的状态

---

### 4.3 高频打赏（Micro-tipping）

**描述**
支持极小金额、可高频调用的打赏机制。

**需求**

* 最小打赏金额：`>= 0.0001 ETH`
* 单地址可连续多次打赏
* 打赏双方状态同时更新

**验收标准**

* 高频打赏不会导致明显延迟
* UI 可实时反映状态变化

---

### 4.4 动态 Metadata（Dynamic Metadata）

**描述**
NFT metadata 根据 FlowState 实时生成。

**方案**

* `tokenURI()` 为 `view`
* metadata 由链上状态直接生成
* 更新频率：**分钟级实时**

**状态映射示例**

| 活跃度 | NFT 状态  |
| --- | ------- |
| 低   | Idle    |
| 中   | Active  |
| 高   | Burning |

---

### 4.5 实时 UI 展示（Demo 级）

**描述**
前端展示 FlowNFT 状态的实时变化。

**需求**

* 轮询 or subscribe 链上数据
* 状态变化 < 5 秒可感知
* 打赏 / 点赞后立即反馈

---

## 5. 非功能需求（Non-functional Requirements）

### 5.1 性能

* 支持 ≥ 100 TPS 的互动行为
* 单区块内并行更新多个用户状态

---

### 5.2 去中心化

* 核心状态 **100% 链上**
* 不依赖中心化 indexer

---

### 5.3 安全性（MVP）

* 防止重复铸造
* 防止 reentrancy（Tip）

---

## 6. 技术架构（High-level Architecture）

```
User
 └─ Frontend (React / Next.js)
       └─ Monad RPC
             ├─ FlowNFT Contract
             ├─ ActivityTracker
             └─ TipModule
```

---

## 7. Monad 专属设计（Hackathon Highlight）

### 为什么 Monad 必不可少

| 特性      | FlowState 的利用方式 |
| ------- | --------------- |
| 并行执行    | 多用户同时互动无冲突      |
| MonadDB | 高频状态读取          |
| 低 Gas   | 高频小额打赏          |
| 快速确认    | 类实时反馈           |

---

## 8. MVP 范围（Hackathon Scope）

### 必须完成

* FlowNFT 合约
* 1 分钟 Epoch 行为统计
* 点赞 + 打赏
* 动态 metadata
* Demo UI

### 可选加分

* Fully on-chain SVG
* 状态动画
* 排行榜（近 5 分钟）

---

## 9. 风险与限制（Risks）

| 风险          | 应对     |
| ----------- | ------ |
| 高频写入        | 利用并行执行 |
| metadata 过大 | 简化字段   |
| UI 延迟       | 快速轮询   |

---

## 10. 成功指标（Success Metrics）

* NFT 状态变化 **肉眼可见**
* 高频打赏连续成功
* 单分钟 ≥ 100 次互动无异常
* 评委能理解：**“这在别的链上很难做到”**

---

## 11. Roadmap（Post-hackathon）

* 更精细的行为权重
* 跨应用身份复用
* 社交关系图
* DAO / Creator 激励
