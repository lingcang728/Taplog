import type { Lecture } from '../types/lecture'

const MIN = 60_000
const SEC = 1000
const t = (min: number, sec = 0) => min * MIN + sec * SEC

const LECTURE_M1: Lecture = {
  id: 'lecture-ui-perf',
  code: 'M1',
  title: {
    zh: '声明式 UI 列表渲染与大规模过滤的性能边界',
    en: 'Declarative UI List Diffing and Scale Boundaries',
  },
  speaker: {
    zh: '林致远 副教授 · 客户端系统架构课',
    en: 'Assoc. Prof. Lin · Client Systems Architecture',
  },
  venue: {
    zh: '第 6 周课堂实录（含万级压测复盘与问答）',
    en: 'Week 6 Lecture Recording (with 10k Benchmarks & Live Q&A)',
  },
  durationMs: t(42, 0),
  humanVerified: true,
  chapters: [
    {
      id: 'm1-ch1',
      index: 1,
      title: {
        zh: '恒定视图数与身份推导机制',
        en: 'Constant View Count & Identity Diffing',
      },
      startMs: t(0, 0),
      endMs: t(10, 30),
      summary: {
        zh: '列表容器只有在每个数据元素映射到恒定数量的子视图时，才能跳过全量遍历直接定位可见行。',
        en: 'List containers skip visiting off-screen elements only when each item resolves to a constant number of rows.',
      },
      schema: {
        kind: 'flow',
        title: {
          zh: '列表按需布局的前置推导链',
          en: 'Lazy Row Resolution Chain',
        },
        subtitle: {
          zh: '本章三项为完整基础结论，不含远端修正（可作无修正对照）',
          en: 'Three self-contained baseline principles with no distant revisions',
        },
        nodes: [
          {
            id: 'm1-n1-1',
            stepTag: { zh: '前提 01', en: 'Premise 01' },
            title: { zh: '稳定数据标识', en: 'Stable Element IDs' },
            caption: {
              zh: '显式 ID 将数据行与底层视图状态一一绑定',
              en: 'Explicit IDs pin row identity across updates',
            },
            edgeLabelToNext: { zh: '支持跳过遍历', en: 'Enables skipping' },
          },
          {
            id: 'm1-n1-2',
            stepTag: { zh: '机制 02', en: 'Mechanism 02' },
            title: { zh: '恒定行映射', en: 'Constant Row Count' },
            caption: {
              zh: '每条数据固定产出 1 行，无需展开全部内容',
              en: 'Exactly one row per item avoids eager scanning',
            },
            edgeLabelToNext: { zh: '按视口实例化', en: 'Viewport instantiation' },
          },
          {
            id: 'm1-n1-3',
            stepTag: { zh: '收益 03', en: 'Outcome 03' },
            title: { zh: '常数级首屏开销', en: 'O(Viewport) Initial Cost' },
            caption: {
              zh: '首屏耗时只取决于可见区行数而非总数据量',
              en: 'First render scales with visible rows, not total N',
            },
          },
        ],
      },
      claims: [
        {
          id: 'm1-c1-1',
          chapterId: 'm1-ch1',
          schemaTargetId: 'm1-n1-1',
          conciseTitle: {
            zh: '显式稳定标识是增量差分的根基',
            en: 'Stable explicit IDs anchor incremental diffing',
          },
          detailedBody: {
            zh: '在声明式列表框架里，框架并不直接持有对象引用，而是依靠每条数据暴露的稳定标识符追踪节点的增删改移。只要标识在数据更新前后保持不变，布局引擎就能精确复用对应行的渲染状态，避免整表销毁重建。',
            en: 'Declarative list engines track insertions, removals, and moves through each item identifier rather than pointer identity. When identifiers remain stable across updates, the renderer reuses existing row state instead of tearing down and rebuilding the entire table.',
          },
          anchors: [
            {
              id: 'm1-a1-1-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(1, 20),
              endMs: t(1, 42),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '声明式列表能做到局部更新，第一个硬前提就是标识稳定...',
                en: 'Incremental list diffing relies first on a stable explicit identifier...',
              },
              fullQuote: {
                zh: '声明式列表能做到局部更新，第一个硬前提就是标识稳定。不要拿数组下标当 ID，一旦前面插入一行，后面所有行的状态缓存都会错位失效。',
                en: 'Incremental list diffing relies first on a stable explicit identifier. Never use array indices as IDs, because inserting one row near the top shifts every downstream identity and throws away cached row state.',
              },
            },
            {
              id: 'm1-a1-1-ex',
              relation: 'example',
              tier: 'elaboration',
              startMs: t(2, 15),
              endMs: t(2, 36),
              offsetFromOriginMs: t(0, 55),
              verbatimLead: {
                zh: '比如邮件列表里新来一封顶置邮件，如果你用索引做键...',
                en: 'Take an inbox where a new pinned email arrives at index zero...',
              },
              fullQuote: {
                zh: '比如邮件列表里新来一封顶置邮件，如果你用索引做键，原本展开的第二封邮件会把展开态错贴到第一封身上，动画也会乱跳。',
                en: 'Take an inbox where a new pinned email arrives at index zero. With index keys, an expanded thread state jumps onto the wrong message and row animations flicker.',
              },
            },
          ],
        },
        {
          id: 'm1-c1-2',
          chapterId: 'm1-ch1',
          schemaTargetId: 'm1-n1-2',
          conciseTitle: {
            zh: '每元素恒定视图数才可免全量访问',
            en: 'Constant views per element avoids full scans',
          },
          detailedBody: {
            zh: '列表容器在计算滚动条总高度与索引偏移时，必须知道第 k 个数据元素前面一共有多少行。如果闭包内的视图树结构静态可判定为恒定行数（例如固定 1 行），引擎只需查集合长度，完全不必实例化屏幕外的数据项。',
            en: 'To map scroll offsets to row positions, the list engine must know how many rows precede element k. When the body statically resolves to a constant row count per element, the container reads collection length directly without visiting off-screen items.',
          },
          anchors: [
            {
              id: 'm1-a1-2-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(4, 10),
              endMs: t(4, 34),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '容器想要不访问屏幕外的元素就完成布局，必须满足每条数据...',
                en: 'The list can avoid visiting all off-screen content only if each item...',
              },
              fullQuote: {
                zh: '容器想要不访问屏幕外的元素就完成布局，必须满足每条数据都解析成恒定数量的行。恒定意味着框架不用真正执行你的视图闭包，就能算出第 500 项在第几行。',
                en: 'The list can avoid visiting all off-screen content only if each item resolves to a constant number of rows. Constant count lets the layout engine compute row indices directly without evaluating view bodies for unseen items.',
              },
            },
            {
              id: 'm1-a1-2-why',
              relation: 'reason',
              tier: 'elaboration',
              startMs: t(5, 5),
              endMs: t(5, 28),
              offsetFromOriginMs: t(0, 55),
              verbatimLead: {
                zh: '背后的数学很简单，恒定行数乘以元素索引就是线性定位...',
                en: 'The math is simple: constant rows times element index gives direct O(1)...',
              },
              fullQuote: {
                zh: '背后的数学很简单，恒定行数乘以元素索引就是线性定位；一旦某个元素可能产出 0 行也可能产出 1 行，引擎就只能从第 0 个元素一路数过去。',
                en: 'The math is simple: constant rows times element index gives direct O(1) mapping. As soon as an element can yield either zero or one row, the engine has no choice but to walk from element zero.',
              },
            },
          ],
        },
        {
          id: 'm1-c1-3',
          chapterId: 'm1-ch1',
          schemaTargetId: 'm1-n1-3',
          conciseTitle: {
            zh: '首屏渲染成本仅与可见行数成正比',
            en: 'First render scales only with visible rows',
          },
          detailedBody: {
            zh: '在满足稳定标识与恒定行数两个前提后，无论底层列表是 100 条还是 50,000 条记录，首屏只需要构建视口内大约 15 到 25 行子视图。滑动时按回收池复用，内存峰值保持平稳。',
            en: 'Once stable IDs and constant row counts hold, initial rendering instantiates only the 15 to 25 rows visible in the viewport regardless of whether the dataset has 100 or 50,000 items. Scrolling recycles row nodes with flat peak memory.',
          },
          anchors: [
            {
              id: 'm1-a1-3-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(7, 45),
              endMs: t(8, 8),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '这两个条件同时成立时，首屏渲染时间就跟总数据量脱钩了...',
                en: 'When both invariants hold, first-frame time decouples from dataset size...',
              },
              fullQuote: {
                zh: '这两个条件同时成立时，首屏渲染时间就跟总数据量脱钩了，一万条数据和二十条数据的冷启动帧耗时几乎一样，都只创建屏幕上看得见的那十几行。',
                en: 'When both invariants hold, first-frame time decouples from dataset size. Cold-start latency for ten thousand items matches twenty items because only visible rows are instantiated.',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'm1-ch2',
      index: 2,
      title: {
        zh: '条件过滤方案的递进演进',
        en: 'Progressive Filtering Pipeline',
      },
      startMs: t(10, 30),
      endMs: t(21, 30),
      summary: {
        zh: '课堂沿着"视图内分支 -> 集合内联过滤 -> 视图模型缓存"三步递进，逐步修复过滤场景下的列表性能。',
        en: 'The lecture walks through three escalating fixes for filtered lists: inline branch, collection filter, and model cache.',
      },
      schema: {
        kind: 'flow',
        title: {
          zh: '过滤实现的递进优化路径',
          en: 'Three-Step Filtering Refinement',
        },
        subtitle: {
          zh: '注意部分课堂中期给出的推荐方案，在后半程压测与问答中有关键限定与改口',
          en: 'Mid-lecture recommendations receive distant caveats and Q&A revisions later in the talk',
        },
        nodes: [
          {
            id: 'm1-n2-1',
            stepTag: { zh: '反例 01', en: 'Pitfall 01' },
            title: { zh: '视图闭包内写 if', en: 'Branch Inside Row Body' },
            caption: {
              zh: '每项返回 0 或 1 行，迫使框架扫描全表',
              en: 'Yields 0 or 1 rows per item, forcing eager scans',
            },
            edgeLabelToNext: { zh: '改到数据源', en: 'Lift to collection' },
          },
          {
            id: 'm1-n2-2',
            stepTag: { zh: '改进 02', en: 'Step 02' },
            title: { zh: '数据集合内联过滤', en: 'Inline Collection Filter' },
            caption: {
              zh: '在循环入参直接 filter，恢复恒定视图数',
              en: 'Filter directly in loop input to restore constant rows',
            },
            edgeLabelToNext: { zh: '进一步抽离', en: 'Extract state' },
          },
          {
            id: 'm1-n2-3',
            stepTag: { zh: '课堂推荐 03', en: 'Recommended 03' },
            title: { zh: '模型层全量缓存数组', en: 'Cached Model Array' },
            caption: {
              zh: '在 ViewModel 预计算过滤结果数组供列表读取',
              en: 'Precompute filtered array once inside ViewModel',
            },
          },
        ],
      },
      claims: [
        {
          id: 'm1-c2-1',
          chapterId: 'm1-ch2',
          schemaTargetId: 'm1-n2-1',
          conciseTitle: {
            zh: '列表闭包内条件分支破坏恒定行数',
            en: 'Conditional view inside loop breaks constant count',
          },
          detailedBody: {
            zh: '很多开发者习惯在列表循环体里直接写 if item.matches 才渲染行视图。这种写法让每个元素的视图产出在 0 和 1 之间摇摆，直接打破恒定视图数假设，框架不得不退化为同步遍历整个集合来清点总行数。',
            en: 'Writing an if condition inside the row builder closure makes each element resolve to either zero or one view. Because the row count is now variable, the list engine falls back to eagerly scanning every item in the dataset just to count total rows.',
          },
          anchors: [
            {
              id: 'm1-a2-1-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(11, 20),
              endMs: t(11, 44),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '最容易踩的坑，就是在循环体里面顺手加一个 if 过滤...',
                en: 'The most tempting mistake is adding an inline if filter inside the loop...',
              },
              fullQuote: {
                zh: '最容易踩的坑，就是在循环体里面顺手加一个 if 过滤。看起来只多了两行代码，但每条数据的视图数从恒定变成了 0 或 1，按需加载瞬间失效。',
                en: 'The most tempting mistake is adding an inline if filter inside the loop body. It looks harmless, yet row count becomes variable - zero or one - which immediately defeats lazy row resolution.',
              },
            },
            {
              id: 'm1-a2-1-why',
              relation: 'reason',
              tier: 'elaboration',
              startMs: t(12, 15),
              endMs: t(12, 38),
              offsetFromOriginMs: t(0, 55),
              verbatimLead: {
                zh: '因为在没跑完那句判断之前，布局引擎根本不知道这行存不存在...',
                en: 'Without running that predicate, layout cannot know if the row exists...',
              },
              fullQuote: {
                zh: '因为在没跑完那句判断之前，布局引擎根本不知道这行存不存在，于是必须把两万个元素全部过一遍闭包才能算出滚动区高度。',
                en: 'Without running that predicate, the layout engine has no idea whether row k exists, so it has to evaluate all twenty thousand closures upfront just to compute scroll height.',
              },
            },
          ],
        },
        {
          id: 'm1-c2-2',
          chapterId: 'm1-ch2',
          schemaTargetId: 'm1-n2-2',
          conciseTitle: {
            zh: '将过滤条件内联进数据集合入参',
            en: 'Move filter inline into data collection',
          },
          detailedBody: {
            zh: '把过滤表达式从视图闭包里挪出来，直接写在传入列表的数据集合上（如 items.filter(match)）。这样循环体内部重新回到无分支的单一路径，每个传入元素稳定产出 1 行视图，代码结构也保持简洁直观。',
            en: 'Lifting the filter predicate out of the row closure onto the input collection expression restores a branch-free row builder. Every element passed into the loop once again produces a constant single row while keeping the call site concise.',
          },
          anchors: [
            {
              id: 'm1-a2-2-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(13, 40),
              endMs: t(14, 2),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '那把过滤直接挪到数据集合入参里怎么样？这样每项又回到了...',
                en: 'What if we move the filter directly onto the collection argument? Now...',
              },
              fullQuote: {
                zh: '那把过滤直接挪到数据集合入参里怎么样？这样循环体里不再有条件分支，每个元素又回到了恒定 1 个视图，写起来非常干净直接。',
                en: 'What if we move the filter directly onto the collection argument? Now the row builder has no branches, we are back to a constant view count per element, and the code stays clean and readable.',
              },
            },
            {
              id: 'm1-a2-2-ex',
              relation: 'example',
              tier: 'elaboration',
              startMs: t(14, 35),
              endMs: t(14, 55),
              offsetFromOriginMs: t(0, 55),
              verbatimLead: {
                zh: '看屏幕右侧这个搜索框示例，在两百条联系人里这样改完之后...',
                en: 'Look at the search box demo on the right with two hundred contacts...',
              },
              fullQuote: {
                zh: '看屏幕右侧这个搜索框示例，在两百条联系人里这样改完之后，滚动条高度立刻稳定了，视图层代码甚至比原来还少了三行。',
                en: 'Look at the search box demo on the right with two hundred contacts: after moving the filter into the collection expression, scroll height stabilizes immediately and the view code gets three lines shorter.',
              },
            },
            {
              id: 'm1-a2-2-caveat',
              relation: 'caveat',
              tier: 'alert',
              startMs: t(37, 50),
              endMs: t(38, 16),
              offsetFromOriginMs: t(24, 10),
              contextBridge: {
                zh: '第 4 节压测复盘 · 演示万级列表掉帧曲线时补充适用上限',
                en: 'Ch 4 Benchmark Review · Added while inspecting 10k-row frame drops',
              },
              verbatimLead: {
                zh: '但千万小心，第 13 分钟那种内联集合过滤是主线程线性扫描...',
                en: 'Be careful though: that inline collection filter from minute 13 is linear...',
              },
              fullQuote: {
                zh: '但千万小心，第 13 分钟那种内联集合过滤是主线程线性扫描。两百条原型里没感觉，一旦超过五千条并且伴随高频状态刷新，每一帧重算过滤都会直接卡死主线程，必须加缓存或倒排索引。',
                en: 'Be careful though: that inline collection filter from minute 13 is linear over the whole collection on the main thread. It works fine in a 200-item prototype, but beyond 5,000 items with frequent state ticks it recalculates O(N) every frame and drops frames badly unless memoized or indexed.',
              },
            },
          ],
        },
        {
          id: 'm1-c2-3',
          chapterId: 'm1-ch2',
          schemaTargetId: 'm1-n2-3',
          conciseTitle: {
            zh: '模型层预计算缓存数组恒为最优',
            en: 'ViewModel cached array is universally optimal',
          },
          detailedBody: {
            zh: '为了避免在视图渲染周期内重复执行过滤，课堂在这一步提出把过滤逻辑抽离到数据模型层，维护一份预计算好的 filteredItems 缓存数组。只有搜索词或源数组变动时才重新生成缓存，列表视图只负责只读渲染。',
            en: 'To avoid re-running filters during view evaluation, the lecture extracts filtering into the ViewModel, maintaining a precomputed filteredItems array. The cache updates only when the query or source list changes, leaving the view strictly read-only.',
          },
          anchors: [
            {
              id: 'm1-a2-3-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(16, 10),
              endMs: t(16, 32),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '所以最稳妥的标准解法，是一律把过滤移到模型层维护一份缓存数组...',
                en: 'So the safest gold-standard pattern is always caching a filtered array...',
              },
              fullQuote: {
                zh: '所以最稳妥的标准解法，是一律把过滤移到模型层维护一份缓存数组。视图只读这份现成数组，既保证恒定视图数，又把计算移出渲染热路径，是工程里的最优解。',
                en: 'So the safest gold-standard pattern is always caching a filtered array in the model. Views simply read that snapshot, giving both constant row counts and zero filtering work on the render hot path.',
              },
            },
            {
              id: 'm1-a2-3-why',
              relation: 'reason',
              tier: 'elaboration',
              startMs: t(16, 50),
              endMs: t(17, 12),
              offsetFromOriginMs: t(0, 40),
              verbatimLead: {
                zh: '这样哪怕界面上别的无关状态每秒刷新六十次，过滤数组也完全不动...',
                en: 'Even if unrelated UI controls re-render at 60Hz, the cached array stays untouched...',
              },
              fullQuote: {
                zh: '这样哪怕界面上别的无关状态每秒刷新六十次，过滤数组也完全不动，视图体重新求值时拿到的只是数组指针。',
                en: 'Even if unrelated UI controls re-render at 60Hz, the cached array stays untouched and view re-evaluation only reads an array reference.',
              },
            },
            {
              id: 'm1-a2-3-corr',
              relation: 'correction',
              tier: 'alert',
              startMs: t(41, 5),
              endMs: t(41, 32),
              offsetFromOriginMs: t(24, 55),
              contextBridge: {
                zh: '课末问答环节 · 同学追问高频单行行情推送场景后讲者改口',
                en: 'Live Q&A · Speaker revises claim after a question on live ticker rows',
              },
              verbatimLead: {
                zh: '你问到行情推送这个点非常好，我前面说缓存数组恒为最优太绝对了...',
                en: 'Great question on live ticker rows; calling cached arrays always optimal was too strong...',
              },
              fullQuote: {
                zh: '你问到行情推送这个点非常好，我前面说模型层缓存数组恒为最优确实说得太绝对了。如果单行字段每秒高频跳动，每次重建全量缓存数组反而会让框架触发整表 diff；这种场景应该放弃全量数组快照，改用按 ID 订阅的索引级惰性投影。',
                en: 'Great question on live ticker rows; calling cached model arrays universally optimal was too absolute. When individual row fields mutate rapidly every second, rebuilding a whole cached array triggers expensive whole-list diffs. There you should drop array snapshots and use ID-indexed lazy projection with per-row observation.',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'm1-ch3',
      index: 3,
      title: {
        zh: '三种列表状态同步策略多维对比',
        en: 'Trade-Off Matrix of List Sync Strategies',
      },
      startMs: t(21, 30),
      endMs: t(33, 0),
      summary: {
        zh: '横向比较内联集合过滤、模型缓存快照与索引级惰性游标在复杂度、内存和局部刷新隔离上的取舍。',
        en: 'Compares inline filtering, model array snapshots, and indexed lazy cursors across compute, memory, and update isolation.',
      },
      schema: {
        kind: 'matrix',
        title: {
          zh: '列表过滤与同步策略对比矩阵',
          en: 'List Filtering & Sync Comparison Matrix',
        },
        subtitle: {
          zh: '矩阵单元格高度压缩；带角标的单元格在后续压测中存在明确限定条件',
          en: 'Compressed cells carry distant boundary badges whenever later benchmarks restrict them',
        },
        columns: [
          { id: 'col-cost', label: { zh: '渲染期重算', en: 'Render Recompute' } },
          { id: 'col-mem', label: { zh: '内存占用', en: 'Memory Footprint' } },
          { id: 'col-iso', label: { zh: '单行刷新隔离', en: 'Row Update Isolation' } },
        ],
        rows: [
          {
            id: 'row-inline',
            subject: { zh: '内联集合过滤', en: 'Inline Filter' },
            subtitle: { zh: '视图表达式直接 filter', en: 'Filter in render expression' },
            cells: [
              { id: 'm1-cell-1', columnId: 'col-cost', value: { zh: '每帧 O(N)', en: 'O(N) per render' } },
              { id: 'm1-cell-2', columnId: 'col-mem', value: { zh: '临时数组分配', en: 'Transient alloc' } },
              { id: 'm1-cell-3', columnId: 'col-iso', value: { zh: '弱（牵连整表）', en: 'Weak (full list)' } },
            ],
          },
          {
            id: 'row-cache',
            subject: { zh: '模型缓存快照', en: 'Model Snapshot' },
            subtitle: { zh: 'ViewModel 存过滤结果', en: 'Cached array in ViewModel' },
            cells: [
              { id: 'm1-cell-4', columnId: 'col-cost', value: { zh: '读开销 O(1)', en: 'O(1) read' } },
              { id: 'm1-cell-5', columnId: 'col-mem', value: { zh: '低（单份镜像）', en: 'Low (1 mirror)' } },
              { id: 'm1-cell-6', columnId: 'col-iso', value: { zh: '中等（依赖粗粒度）', en: 'Medium (coarse)' } },
            ],
          },
          {
            id: 'row-cursor',
            subject: { zh: '索引级惰性投影', en: 'Indexed Projection' },
            subtitle: { zh: '仅存 ID 列表按行订阅', en: 'ID array + per-row sub' },
            cells: [
              { id: 'm1-cell-7', columnId: 'col-cost', value: { zh: '仅算脏行 O(1)', en: 'O(1) dirty row' } },
              { id: 'm1-cell-8', columnId: 'col-mem', value: { zh: '极低（仅存键）', en: 'Minimal (IDs only)' } },
              { id: 'm1-cell-9', columnId: 'col-iso', value: { zh: '强（单行独立）', en: 'Strong (per-row)' } },
            ],
          },
        ],
      },
      claims: [
        {
          id: 'm1-c3-1',
          chapterId: 'm1-ch3',
          schemaTargetId: 'm1-cell-5',
          conciseTitle: {
            zh: '模型缓存快照额外内存占用较低',
            en: 'Model snapshot keeps extra memory low',
          },
          detailedBody: {
            zh: '在常规单页列表场景下，模型层缓存快照只额外保留一份指向现有对象的引用数组，并不深拷贝整条业务实体，因此常规状态下内存增幅可以忽略不计。',
            en: 'For a standard single-page list, a ViewModel snapshot stores only one extra array of references rather than deep-copying entities, keeping steady-state memory overhead modest.',
          },
          anchors: [
            {
              id: 'm1-a3-1-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(23, 50),
              endMs: t(24, 12),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '内存这一列大家别被缓存两字吓到，单份镜像其实只是存引用...',
                en: 'Do not let the word snapshot scare you on memory; it stores references...',
              },
              fullQuote: {
                zh: '内存这一列大家别被缓存两字吓到，单份镜像其实只是存一份对象引用，万级列表也才几十 KB，整体占用很低。',
                en: 'Do not let the word snapshot scare you on memory; one mirror holds references only, taking tens of kilobytes even at ten thousand rows.',
              },
            },
            {
              id: 'm1-a3-1-caveat',
              relation: 'caveat',
              tier: 'alert',
              startMs: t(38, 45),
              endMs: t(39, 10),
              offsetFromOriginMs: t(14, 55),
              contextBridge: {
                zh: '第 4 节内存剖析 · 展示值语义结构体与多标签页分页合并时补充',
                en: 'Ch 4 Memory Profile · Added for value-type structs across multi-tab pagination',
              },
              verbatimLead: {
                zh: '不过在值类型语言里，如果结构体自带大块富文本或图片缓冲...',
                en: 'In value-type languages though, if structs embed rich text or image buffers...',
              },
              fullQuote: {
                zh: '不过在值类型语言里，如果结构体自带大块富文本，或者同时挂着五个筛选标签页各自保存快照，写时复制一触发内存峰值会翻三到四倍，这时不能直接存整条值快照。',
                en: 'In value-type languages though, if structs embed large rich text payloads or five filter tabs retain separate snapshots, copy-on-write spikes peak memory 3-4x; avoid storing full value copies there.',
              },
            },
          ],
        },
        {
          id: 'm1-c3-2',
          chapterId: 'm1-ch3',
          schemaTargetId: 'm1-cell-9',
          conciseTitle: {
            zh: '索引级投影可实现严格的单行刷新隔离',
            en: 'Indexed projection isolates single-row updates',
          },
          detailedBody: {
            zh: '当列表外层只订阅轻量 ID 序列，而把行内正文、点赞数或实时价格的依赖下沉到单行子组件时，某一行字段变化不会触发父列表重新求值，更新范围被锁死在单个单元格。',
            en: 'When the list subscribes strictly to a lightweight ID array and each row child subscribes to its own record fields, mutating a single field leaves the parent list untouched and re-renders only that row.',
          },
          anchors: [
            {
              id: 'm1-a3-2-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(28, 10),
              endMs: t(28, 34),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '第三行的索引投影把父列表和单行状态彻底解耦了，单行变化...',
                en: 'Indexed projection decouples parent list identity from row fields...',
              },
              fullQuote: {
                zh: '第三行的索引投影把父列表和单行状态彻底解耦了，单行变化完全不会惊动父列表的 diff，隔离性在三种方案里最强。',
                en: 'Indexed projection decouples parent list identity from row fields, so a row update never triggers parent diffing; it delivers the strongest isolation of the three patterns.',
              },
            },
            {
              id: 'm1-a3-2-ex',
              relation: 'example',
              tier: 'elaboration',
              startMs: t(29, 0),
              endMs: t(29, 20),
              offsetFromOriginMs: t(0, 50),
              verbatimLead: {
                zh: '像实时聊天室里正在输入状态或者已读回执，只改那一条消息...',
                en: 'Think of read receipts or typing indicators in a busy chat room...',
              },
              fullQuote: {
                zh: '像实时聊天室里正在输入状态或者已读回执，只改那一条消息对应的行视图，其他两千条消息纹丝不动。',
                en: 'Think of read receipts or typing indicators in a busy chat room: only that message row re-renders while two thousand other rows remain untouched.',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'm1-ch4',
      index: 4,
      title: {
        zh: '万级数据压测复盘与现场问答',
        en: '10k-Row Benchmark Review & Live Q&A',
      },
      startMs: t(33, 0),
      endMs: t(42, 0),
      summary: {
        zh: '通过真机 Instruments 火焰图验证大数据集下的帧率拐点，并在问答环节修正了前期关于缓存数组的绝对化建议。',
        en: 'Profiles frame-drop thresholds on real 10k-row traces and refines earlier array-caching advice during live Q&A.',
      },
      schema: {
        kind: 'flow',
        title: {
          zh: '压测复盘与工程决策清单',
          en: 'Benchmark Review & Final Checklist',
        },
        subtitle: {
          zh: '本节汇集实测拐点与问答纠偏，对应前两章的远端锚点',
          en: 'Houses the distant empirical caveats and Q&A revisions referenced above',
        },
        nodes: [
          {
            id: 'm1-n4-1',
            stepTag: { zh: '压测 01', en: 'Profile 01' },
            title: { zh: '5000 条规模拐点', en: '5,000-Item Inflection' },
            caption: {
              zh: '超过 5000 条后主线程内联过滤稳定跌破 60fps',
              en: 'Inline main-thread filter drops below 60fps past 5k items',
            },
            edgeLabelToNext: { zh: '问答收束', en: 'Q&A synthesis' },
          },
          {
            id: 'm1-n4-2',
            stepTag: { zh: '问答 02', en: 'Q&A 02' },
            title: { zh: '按突变频率选策略', en: 'Choose by Mutation Rate' },
            caption: {
              zh: '低频读多用快照，高频单行写改索引投影',
              en: 'Snapshots for read-heavy lists; indexed projection for hot rows',
            },
          },
        ],
      },
      claims: [
        {
          id: 'm1-c4-1',
          chapterId: 'm1-ch4',
          schemaTargetId: 'm1-n4-1',
          conciseTitle: {
            zh: '压测显示五千条是内联过滤掉帧分水岭',
            en: 'Profiling puts inline-filter drop-off at 5,000 rows',
          },
          detailedBody: {
            zh: '课堂展示的真机时间剖析曲线显示，数据量在 500 条以内时三种方案帧率差异极小；越过 5,000 条且伴随输入法连续敲击后，内联集合过滤的帧耗时迅速突破 16.6ms 预算。',
            en: 'Device profiling traces show negligible gap below 500 items, but once collection size crosses 5,000 rows during continuous typing, inline collection filtering breaks the 16.6ms frame budget immediately.',
          },
          anchors: [
            {
              id: 'm1-a4-1-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(37, 25),
              endMs: t(37, 48),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '看这张火焰图横轴，五百条以内曲线几乎贴着底边走，一过五千条...',
                en: 'Look at the flamegraph x-axis: below 500 items everything stays flat...',
              },
              fullQuote: {
                zh: '看这张火焰图横轴，五百条以内曲线几乎贴着底边走，一过五千条内联过滤的红柱子就冲破 16 毫秒红线了。',
                en: 'Look at the flamegraph x-axis: below 500 items everything stays flat, and past 5,000 items the inline filter bars blow right through the 16.6ms frame budget.',
              },
            },
          ],
        },
        {
          id: 'm1-c4-2',
          chapterId: 'm1-ch4',
          schemaTargetId: 'm1-n4-2',
          conciseTitle: {
            zh: '最终选型取决于单行字段的写入频率',
            en: 'Final choice depends on per-row write frequency',
          },
          detailedBody: {
            zh: '结合问答环节的追问，讲者把全课的选型规则收敛为二维判断：规模小用简洁写法，规模大且读多写少用模型缓存快照，规模大且单行字段高频跳动则必须切换到索引级惰性投影。',
            en: 'Synthesizing the Q&A discussion, the speaker narrows selection to mutation rate: small sets tolerate inline syntax, large read-heavy sets suit model snapshots, and hot per-row streams require ID-indexed projection.',
          },
          anchors: [
            {
              id: 'm1-a4-2-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(41, 35),
              endMs: t(41, 54),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '把今天最后一条结论记下来：别背绝对最优，先问单行更新频率...',
                en: 'Write this final rule down: skip absolutes and check per-row mutation rate...',
              },
              fullQuote: {
                zh: '把今天最后一条结论记下来：别背绝对最优，先问两个问题，总规模过不过五千，以及单行字段是不是每秒都在变。',
                en: 'Write this final rule down: skip absolute rules and ask two questions first: does N exceed 5,000, and do individual row fields mutate every second.',
              },
            },
          ],
        },
      ],
    },
  ],
  transcript: [
    {
      id: 'm1-t01',
      startMs: t(0, 30),
      endMs: t(1, 18),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '大家把上次作业里卡顿的列表页面打开，今天我们拆解声明式列表在底层到底怎么算布局，为什么一加过滤就突然掉帧。',
        en: 'Open the sluggish list project from last week. Today we dissect how declarative list layout works under the hood and why filtering suddenly triggers frame drops.',
      },
    },
    {
      id: 'm1-t02',
      startMs: t(1, 20),
      endMs: t(1, 42),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '声明式列表能做到局部更新，第一个硬前提就是标识稳定。不要拿数组下标当 ID，一旦前面插入一行，后面所有行的状态缓存都会错位失效。',
        en: 'Incremental list diffing relies first on a stable explicit identifier. Never use array indices as IDs, because inserting one row near the top shifts every downstream identity and throws away cached row state.',
      },
    },
    {
      id: 'm1-t03',
      startMs: t(1, 45),
      endMs: t(2, 12),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '很多同学问，那我自己生成随机 UUID 写在渲染函数里行不行？更不行，每次刷新都换新 ID 等于强制整表重绘。',
        en: 'Students often ask if generating a random UUID inside render works. That is even worse: every refresh mints fresh IDs and forces a full table rebuild.',
      },
    },
    {
      id: 'm1-t04',
      startMs: t(2, 15),
      endMs: t(2, 36),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '比如邮件列表里新来一封顶置邮件，如果你用索引做键，原本展开的第二封邮件会把展开态错贴到第一封身上，动画也会乱跳。',
        en: 'Take an inbox where a new pinned email arrives at index zero. With index keys, an expanded thread state jumps onto the wrong message and row animations flicker.',
      },
    },
    {
      id: 'm1-t05',
      startMs: t(3, 40),
      endMs: t(4, 8),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '有了稳定 ID 之后，第二个更隐蔽的条件叫恒定视图数，这是今天前半节课的核心。',
        en: 'Once IDs are stable, the second and more subtle invariant is constant view count per element.',
      },
    },
    {
      id: 'm1-t06',
      startMs: t(4, 10),
      endMs: t(4, 34),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '容器想要不访问屏幕外的元素就完成布局，必须满足每条数据都解析成恒定数量的行。恒定意味着框架不用真正执行你的视图闭包，就能算出第 500 项在第几行。',
        en: 'The list can avoid visiting all off-screen content only if each item resolves to a constant number of rows. Constant count lets the layout engine compute row indices directly without evaluating view bodies for unseen items.',
      },
    },
    {
      id: 'm1-t07',
      startMs: t(4, 38),
      endMs: t(5, 2),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '注意这里的恒定不一定是 1，每条数据固定输出 2 行也叫恒定，只要在编译期结构上是固定的倍数就行。',
        en: 'Notice constant does not have to mean 1; a fixed 2 rows per item is also constant as long as the multiplier is statically known.',
      },
    },
    {
      id: 'm1-t08',
      startMs: t(5, 5),
      endMs: t(5, 28),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '背后的数学很简单，恒定行数乘以元素索引就是线性定位；一旦某个元素可能产出 0 行也可能产出 1 行，引擎就只能从第 0 个元素一路数过去。',
        en: 'The math is simple: constant rows times element index gives direct O(1) mapping. As soon as an element can yield either zero or one row, the engine has no choice but to walk from element zero.',
      },
    },
    {
      id: 'm1-t09',
      startMs: t(7, 45),
      endMs: t(8, 8),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '这两个条件同时成立时，首屏渲染时间就跟总数据量脱钩了，一万条数据和二十条数据的冷启动帧耗时几乎一样，都只创建屏幕上看得见的那十几行。',
        en: 'When both invariants hold, first-frame time decouples from dataset size. Cold-start latency for ten thousand items matches twenty items because only visible rows are instantiated.',
      },
    },
    {
      id: 'm1-t10',
      startMs: t(10, 50),
      endMs: t(11, 18),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '好，现在需求来了：产品经理让你给这个列表加一个搜索过滤开关。我们看大家平时最常写的第一版代码。',
        en: 'Now comes a real feature request: add a search filter to this list. Look at the first implementation almost everyone writes.',
      },
    },
    {
      id: 'm1-t11',
      startMs: t(11, 20),
      endMs: t(11, 44),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '最容易踩的坑，就是在循环体里面顺手加一个 if 过滤。看起来只多了两行代码，但每条数据的视图数从恒定变成了 0 或 1，按需加载瞬间失效。',
        en: 'The most tempting mistake is adding an inline if filter inside the loop body. It looks harmless, yet row count becomes variable - zero or one - which immediately defeats lazy row resolution.',
      },
    },
    {
      id: 'm1-t12',
      startMs: t(11, 48),
      endMs: t(12, 12),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '所以你在调试器里会看到，哪怕屏幕上只显示了 8 行，日志却把后面两万条数据的行构造函数全打印了一遍。',
        en: 'So in the debugger, even though only 8 rows appear on screen, your logs print row initializers for all twenty thousand elements.',
      },
    },
    {
      id: 'm1-t13',
      startMs: t(12, 15),
      endMs: t(12, 38),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '因为在没跑完那句判断之前，布局引擎根本不知道这行存不存在，于是必须把两万个元素全部过一遍闭包才能算出滚动区高度。',
        en: 'Without running that predicate, the layout engine has no idea whether row k exists, so it has to evaluate all twenty thousand closures upfront just to compute scroll height.',
      },
    },
    {
      id: 'm1-t14',
      startMs: t(13, 15),
      endMs: t(13, 38),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '怎么修？既然问题出在循环体里出现了分支，那我们干脆把分支移到循环外面。',
        en: 'How do we fix it? Since the branch inside the loop body broke constant count, lift it outside the loop.',
      },
    },
    {
      id: 'm1-t15',
      startMs: t(13, 40),
      endMs: t(14, 2),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '那把过滤直接挪到数据集合入参里怎么样？这样循环体里不再有条件分支，每个元素又回到了恒定 1 个视图，写起来非常干净直接。',
        en: 'What if we move the filter directly onto the collection argument? Now the row builder has no branches, we are back to a constant view count per element, and the code stays clean and readable.',
      },
    },
    {
      id: 'm1-t16',
      startMs: t(14, 5),
      endMs: t(14, 32),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '很多团队改到这一步就提交 PR 了，因为测试数据只有几十上百条，界面立刻丝滑。',
        en: 'Many teams merge their PR right here because staging fixtures have only a few dozen records and scrolling immediately looks silky.',
      },
    },
    {
      id: 'm1-t17',
      startMs: t(14, 35),
      endMs: t(14, 55),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '看屏幕右侧这个搜索框示例，在两百条联系人里这样改完之后，滚动条高度立刻稳定了，视图层代码甚至比原来还少了三行。',
        en: 'Look at the search box demo on the right with two hundred contacts: after moving the filter into the collection expression, scroll height stabilizes immediately and the view code gets three lines shorter.',
      },
    },
    {
      id: 'm1-t18',
      startMs: t(15, 40),
      endMs: t(16, 8),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '当然，如果我们想写得更规范、更符合架构分层，还可以往前走第三步，把过滤彻底搬出视图层。',
        en: 'Of course, for cleaner layering we can take step three and move filtering completely out of the view.',
      },
    },
    {
      id: 'm1-t19',
      startMs: t(16, 10),
      endMs: t(16, 32),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '所以最稳妥的标准解法，是一律把过滤移到模型层维护一份缓存数组。视图只读这份现成数组，既保证恒定视图数，又把计算移出渲染热路径，是工程里的最优解。',
        en: 'So the safest gold-standard pattern is always caching a filtered array in the model. Views simply read that snapshot, giving both constant row counts and zero filtering work on the render hot path.',
      },
    },
    {
      id: 'm1-t20',
      startMs: t(16, 50),
      endMs: t(17, 12),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '这样哪怕界面上别的无关状态每秒刷新六十次，过滤数组也完全不动，视图体重新求值时拿到的只是数组指针。',
        en: 'Even if unrelated UI controls re-render at 60Hz, the cached array stays untouched and view re-evaluation only reads an array reference.',
      },
    },
    {
      id: 'm1-t21',
      startMs: t(23, 20),
      endMs: t(23, 48),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '我们把这三种策略拉成一张对比矩阵，从重算复杂度、内存占用、单行隔离三个维度逐格打分。',
        en: 'Let us line all three strategies up in a comparison matrix across recomputation, memory footprint, and row-level isolation.',
      },
    },
    {
      id: 'm1-t22',
      startMs: t(23, 50),
      endMs: t(24, 12),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '内存这一列大家别被缓存两字吓到，单份镜像其实只是存一份对象引用，万级列表也才几十 KB，整体占用很低。',
        en: 'Do not let the word snapshot scare you on memory; one mirror holds references only, taking tens of kilobytes even at ten thousand rows.',
      },
    },
    {
      id: 'm1-t23',
      startMs: t(28, 10),
      endMs: t(28, 34),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '第三行的索引投影把父列表和单行状态彻底解耦了，单行变化完全不会惊动父列表的 diff，隔离性在三种方案里最强。',
        en: 'Indexed projection decouples parent list identity from row fields, so a row update never triggers parent diffing; it delivers the strongest isolation of the three patterns.',
      },
    },
    {
      id: 'm1-t24',
      startMs: t(29, 0),
      endMs: t(29, 20),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '像实时聊天室里正在输入状态或者已读回执，只改那一条消息对应的行视图，其他两千条消息纹丝不动。',
        en: 'Think of read receipts or typing indicators in a busy chat room: only that message row re-renders while two thousand other rows remain untouched.',
      },
    },
    {
      id: 'm1-t25',
      startMs: t(37, 0),
      endMs: t(37, 23),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '刚才休息前大家看了理论表格，现在我们把真机连上，直接灌一万条真实订单数据跑一遍压测，你会看到几个前半节课没展开的坑。',
        en: 'Before the break we saw the clean theory table. Now let us plug in a real device with ten thousand order rows; several limits we did not cover earlier are about to show up.',
      },
    },
    {
      id: 'm1-t26',
      startMs: t(37, 25),
      endMs: t(37, 48),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '看这张火焰图横轴，五百条以内曲线几乎贴着底边走，一过五千条内联过滤的红柱子就冲破 16 毫秒红线了。',
        en: 'Look at the flamegraph x-axis: below 500 items everything stays flat, and past 5,000 items the inline filter bars blow right through the 16.6ms frame budget.',
      },
    },
    {
      id: 'm1-t27',
      startMs: t(37, 50),
      endMs: t(38, 16),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '但千万小心，第 13 分钟那种内联集合过滤是主线程线性扫描。两百条原型里没感觉，一旦超过五千条并且伴随高频状态刷新，每一帧重算过滤都会直接卡死主线程，必须加缓存或倒排索引。',
        en: 'Be careful though: that inline collection filter from minute 13 is linear over the whole collection on the main thread. It works fine in a 200-item prototype, but beyond 5,000 items with frequent state ticks it recalculates O(N) every frame and drops frames badly unless memoized or indexed.',
      },
    },
    {
      id: 'm1-t28',
      startMs: t(38, 18),
      endMs: t(38, 42),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '再切到内存分配面板，刚才对比矩阵里我们给模型缓存快照填了"低占用"，这里要补一个重要条件。',
        en: 'Now switch to the memory profiler. Earlier in the matrix we marked model snapshots as low memory, and here is an important caveat.',
      },
    },
    {
      id: 'm1-t29',
      startMs: t(38, 45),
      endMs: t(39, 10),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '不过在值类型语言里，如果结构体自带大块富文本，或者同时挂着五个筛选标签页各自保存快照，写时复制一触发内存峰值会翻三到四倍，这时不能直接存整条值快照。',
        en: 'In value-type languages though, if structs embed large rich text payloads or five filter tabs retain separate snapshots, copy-on-write spikes peak memory 3-4x; avoid storing full value copies there.',
      },
    },
    {
      id: 'm1-t30',
      startMs: t(40, 35),
      endMs: t(41, 2),
      speaker: { zh: '课堂提问', en: 'Student Q&A' },
      text: {
        zh: '老师，我有个问题：您前面说模型层全量缓存数组恒为最优，但如果我做的是证券行情列表，每秒几百个股票价格都在跳，每次重算缓存数组不会导致整个列表不停 diff 吗？',
        en: 'Professor, earlier you said a cached model array is universally optimal. What if I build a live stock ticker where hundreds of row prices tick every second - wouldn t rebuilding the cached array force whole-list diffs?',
      },
    },
    {
      id: 'm1-t31',
      startMs: t(41, 5),
      endMs: t(41, 32),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '你问到行情推送这个点非常好，我前面说模型层缓存数组恒为最优确实说得太绝对了。如果单行字段每秒高频跳动，每次重建全量缓存数组反而会让框架触发整表 diff；这种场景应该放弃全量数组快照，改用按 ID 订阅的索引级惰性投影。',
        en: 'Great question on live ticker rows; calling cached model arrays universally optimal was too absolute. When individual row fields mutate rapidly every second, rebuilding a whole cached array triggers expensive whole-list diffs. There you should drop array snapshots and use ID-indexed lazy projection with per-row observation.',
      },
    },
    {
      id: 'm1-t32',
      startMs: t(41, 35),
      endMs: t(41, 54),
      speaker: { zh: '林致远', en: 'Prof. Lin' },
      text: {
        zh: '把今天最后一条结论记下来：别背绝对最优，先问两个问题，总规模过不过五千，以及单行字段是不是每秒都在变。',
        en: 'Write this final rule down: skip absolute rules and ask two questions first: does N exceed 5,000, and do individual row fields mutate every second.',
      },
    },
  ],
  studyTasks: [
    {
      id: 'm1-task-t1',
      kind: 't1',
      targetClaimId: 'm1-c2-2',
      prompt: {
        zh: 'T1（适用条件）关于"将过滤条件内联进数据集合入参"，讲者认为它在什么情况下会明显失效？',
        en: 'T1 (Condition) Under what condition does moving the filter inline into the collection break down according to the speaker?',
      },
      options: [
        { id: 'a', label: { zh: '完全不会失效，只要循环体里没有 if 就恒定流畅', en: 'It never breaks down once the row body has no if branch' } },
        { id: 'b', label: { zh: '数据量超过约 5,000 条且伴随高频刷新时，主线程 O(N) 扫描会导致掉帧', en: 'Beyond ~5,000 items with frequent state ticks, O(N) main-thread scans drop frames' } },
        { id: 'c', label: { zh: '仅在使用了随机数组下标作为 ID 时才会变慢', en: 'Only when array indices are used as item identifiers' } },
      ],
      correctOptionId: 'b',
    },
    {
      id: 'm1-task-t2',
      kind: 't2',
      targetClaimId: 'm1-c2-3',
      twoStepConfidence: true,
      prompt: {
        zh: 'T2（陷阱核实 · 测 H5）判断讲者的最终立场：在包含高频实时行情字段跳动的列表里，讲者是否仍然支持"模型层全量缓存数组恒为最优"？',
        en: 'T2 (Trap Check · H5) Does the speaker still stand by "a cached model array is universally optimal" for lists with rapid per-row ticker mutations?',
      },
      options: [
        { id: 'yes', label: { zh: '支持：模型层缓存数组是所有工程场景的标准最优解', en: 'Yes: cached model arrays remain optimal across all scenarios' } },
        { id: 'no', label: { zh: '不支持：讲者在问答环节修正了该说法，改推索引级惰性投影', en: 'No: speaker retracted this in Q&A in favor of ID-indexed lazy projection' } },
        { id: 'unclear', label: { zh: '讲者未讨论单行高频刷新场景', en: 'The speaker never addressed rapid per-row updates' } },
      ],
      correctOptionId: 'no',
    },
    {
      id: 'm1-task-t3',
      kind: 't3',
      targetClaimId: 'm1-c3-1',
      prompt: {
        zh: 'T3（引用核对）关于"模型缓存快照内存占用低"的补充限制，讲者提到哪类场景会让内存峰值翻 3 到 4 倍？',
        en: 'T3 (Citation Check) Which scenario did the speaker cite as causing a 3-4x memory spike for model snapshots?',
      },
      options: [
        { id: 'a', label: { zh: '值类型语言存大块富文本，或多标签页各存快照触发写时复制', en: 'Value-type structs with large rich text or multi-tab snapshots triggering copy-on-write' } },
        { id: 'b', label: { zh: '开启了首屏视口按需回收池', en: 'Enabling viewport row recycling' } },
        { id: 'c', label: { zh: '在 200 条联系人列表里搜索中文关键词', en: 'Searching Chinese keywords across 200 contacts' } },
      ],
      correctOptionId: 'a',
    },
    {
      id: 'm1-task-t4',
      kind: 't4',
      targetClaimId: 'm1-c1-2',
      prompt: {
        zh: 'T4（无修正对照）为什么列表容器要求每个元素映射到恒定数量的子视图？',
        en: 'T4 (Unamended Control) Why does the list container require a constant number of rows per element?',
      },
      options: [
        { id: 'a', label: { zh: '为了不访问屏幕外元素也能直接算出索引对应的行位置', en: 'To map element indices to row positions without visiting off-screen items' } },
        { id: 'b', label: { zh: '为了让后端接口返回更少的 JSON 字段', en: 'To reduce backend JSON payload size' } },
        { id: 'c', label: { zh: '因为第 4 节问答里取消了这个要求', en: 'Because Q&A later lifted this requirement' } },
      ],
      correctOptionId: 'a',
    },
  ],
}

const LECTURE_M2: Lecture = {
  id: 'lecture-sync-locks',
  code: 'M2',
  title: {
    zh: '多核并发同步：自旋锁、互斥锁与虚拟化陷阱',
    en: 'Multicore Synchronization: Spinlocks, Mutexes and VM Traps',
  },
  speaker: {
    zh: '陈默 教授 · 操作系统内核专题',
    en: 'Prof. Chen · Operating Systems Kernel Seminar',
  },
  venue: {
    zh: '第 9 周公开课录音（含云主机实测与问答）',
    en: 'Week 9 Open Lecture (with Cloud VM Profiling & Q&A)',
  },
  durationMs: t(38, 0),
  humanVerified: true,
  chapters: [
    {
      id: 'm2-ch1',
      index: 1,
      title: {
        zh: '三大同步原语性能对比',
        en: 'Core Synchronization Primitives Matrix',
      },
      startMs: t(0, 0),
      endMs: t(13, 0),
      summary: {
        zh: '对比自旋锁、自适应互斥锁与读写锁在短临界区吞吐量、上下文切换开销及尾延迟上的经典权衡。',
        en: 'Compares spinlocks, adaptive mutexes, and reader-writer locks across throughput, switch overhead, and tail latency.',
      },
      schema: {
        kind: 'matrix',
        title: {
          zh: '多核同步原语多维对比矩阵',
          en: 'Multicore Lock Comparison Matrix',
        },
        subtitle: {
          zh: '物理裸机下的经典指标；注意自旋锁在云端虚拟化章节存在远端失效边界',
          en: 'Bare-metal benchmarks; watch for the virtualization caveat added 22 minutes later',
        },
        columns: [
          { id: 'c-tp', label: { zh: '短临界区吞吐', en: 'Short-CS Throughput' } },
          { id: 'c-ctx', label: { zh: '线程切换开销', en: 'Context-Switch Cost' } },
          { id: 'c-tail', label: { zh: '高争用尾延迟', en: 'Contended Tail Latency' } },
        ],
        rows: [
          {
            id: 'r-spin',
            subject: { zh: '自旋锁 (Spinlock)', en: 'Spinlock' },
            subtitle: { zh: '原地忙等，不让出 CPU', en: 'Busy-wait on core' },
            cells: [
              { id: 'm2-cell-1', columnId: 'c-tp', value: { zh: '极高（零切换）', en: 'Very High (0 switch)' } },
              { id: 'm2-cell-2', columnId: 'c-ctx', value: { zh: '零内核态陷入', en: 'Zero syscall' } },
              { id: 'm2-cell-3', columnId: 'c-tail', value: { zh: '受缓存抖动影响', en: 'Cache-bounce bound' } },
            ],
          },
          {
            id: 'r-mutex',
            subject: { zh: '自适应互斥锁', en: 'Adaptive Mutex' },
            subtitle: { zh: '短自旋后睡眠排队', en: 'Brief spin then sleep' },
            cells: [
              { id: 'm2-cell-4', columnId: 'c-tp', value: { zh: '中高（折中稳健）', en: 'High (balanced)' } },
              { id: 'm2-cell-5', columnId: 'c-ctx', value: { zh: '争用时陷入内核', en: 'Syscall on contention' } },
              { id: 'm2-cell-6', columnId: 'c-tail', value: { zh: '可控（公平唤醒）', en: 'Bounded (FIFO wake)' } },
            ],
          },
          {
            id: 'r-rw',
            subject: { zh: '读写锁 (RWLock)', en: 'Read-Write Lock' },
            subtitle: { zh: '允许读者共享临界区', en: 'Shared readers' },
            cells: [
              { id: 'm2-cell-7', columnId: 'c-tp', value: { zh: '读多写少场景高', en: 'High when read-heavy' } },
              { id: 'm2-cell-8', columnId: 'c-ctx', value: { zh: '维护读计数原子写', en: 'Atomic reader count' } },
              { id: 'm2-cell-9', columnId: 'c-tail', value: { zh: '写者可能饥饿', en: 'Writer starvation risk' } },
            ],
          },
        ],
      },
      claims: [
        {
          id: 'm2-c1-1',
          chapterId: 'm2-ch1',
          schemaTargetId: 'm2-cell-1',
          conciseTitle: {
            zh: '短临界区下自旋锁吞吐量极高',
            en: 'Spinlocks deliver peak throughput for short critical sections',
          },
          detailedBody: {
            zh: '当临界区仅包含几十纳秒的指针交换或计数累加时，传统互斥锁一次线程休眠与唤醒动辄耗费数微秒。自旋锁让等待线程停留在当前核心原地轮询，省去了昂贵的内核态切换，吞吐量显著领先。',
            en: 'When a critical section runs for only tens of nanoseconds, sleeping and waking a thread via a mutex costs microseconds of kernel scheduling overhead. Spinlocks keep waiters hot on-core, avoiding syscalls and maximizing throughput.',
          },
          anchors: [
            {
              id: 'm2-a1-1-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(8, 10),
              endMs: t(8, 34),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '先看矩阵左上角，几十纳秒的短临界区里自旋锁吞吐量一骑绝尘...',
                en: 'Look at the top-left cell: for 50ns critical sections spinlocks dominate...',
              },
              fullQuote: {
                zh: '先看矩阵左上角，几十纳秒的短临界区里自旋锁吞吐量一骑绝尘，因为它彻底避开了内核线程切换，等上几十个时钟周期锁就到手了。',
                en: 'Look at the top-left cell: for 50ns critical sections spinlocks dominate throughput because they avoid kernel context switches entirely and acquire the lock within dozens of cycles.',
              },
            },
            {
              id: 'm2-a1-1-why',
              relation: 'reason',
              tier: 'elaboration',
              startMs: t(9, 5),
              endMs: t(9, 26),
              offsetFromOriginMs: t(0, 55),
              verbatimLead: {
                zh: '一次完整的线程挂起加重新调度大概要花三到五微秒，比持锁本身...',
                en: 'One full park-and-wake cycle takes 3 to 5 microseconds, far longer than...',
              },
              fullQuote: {
                zh: '一次完整的线程挂起加重新调度大概要花三到五微秒，比持锁本身还长一百倍，所以不睡眠反而是最省资源的。',
                en: 'One full park-and-wake cycle takes 3 to 5 microseconds, roughly 100x longer than holding the lock itself, so staying awake saves cycles.',
              },
            },
            {
              id: 'm2-a1-1-caveat',
              relation: 'caveat',
              tier: 'alert',
              startMs: t(30, 20),
              endMs: t(30, 48),
              offsetFromOriginMs: t(22, 10),
              contextBridge: {
                zh: '第 3 节云主机实测 · 展示 Hypervisor vCPU 抢占造成的锁持有者被换出',
                en: 'Ch 3 Cloud VM Profiling · Added when lock-holder vCPU is preempted',
              },
              verbatimLead: {
                zh: '把刚才第 8 分钟的吞吐表拿到超售云主机上，自旋锁会直接雪崩...',
                en: 'Take that minute-8 throughput table onto an oversubscribed cloud VM and...',
              },
              fullQuote: {
                zh: '把刚才第 8 分钟的吞吐表拿到超售云主机上，自旋锁吞吐会直接雪崩掉九成。因为一旦持锁线程所在的虚拟 CPU 被宿主机抢占换出，其余核心上的自旋线程就会白白空转整整一个时间片，全卡死在锁持有者抢占问题上。',
                en: 'Take that minute-8 throughput table onto an oversubscribed cloud VM and spinlock throughput collapses by 90%. If the hypervisor preempts the vCPU holding the lock, every other spinning vCPU burns its entire time slice waiting for a descheduled holder.',
              },
            },
          ],
        },
        {
          id: 'm2-c1-2',
          chapterId: 'm2-ch1',
          schemaTargetId: 'm2-cell-6',
          conciseTitle: {
            zh: '自适应互斥锁在高争用下尾延迟可控',
            en: 'Adaptive mutex bounds tail latency under contention',
          },
          detailedBody: {
            zh: '自适应互斥锁在轻度冲突时先短暂自旋几十次，一旦检测到持锁者不在运行队列或等待超时，立刻转入内核等待队列休眠，从而防止 CPU 空耗并维持可预测的 P99 尾延迟。',
            en: 'Adaptive mutexes spin briefly under light contention and transition into the kernel wait queue as soon as the lock owner is descheduled or the spin budget expires, bounding P99 tail latency cleanly.',
          },
          anchors: [
            {
              id: 'm2-a1-2-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(10, 40),
              endMs: t(11, 2),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '对比看第二行，自适应互斥锁最值钱的特性是高争用下尾延迟稳...',
                en: 'Look at row two: the adaptive mutex shines by keeping P99 tail latency...',
              },
              fullQuote: {
                zh: '对比看第二行，自适应互斥锁最值钱的特性是高争用下尾延迟稳，按等待队列有序唤醒，不会出现单个线程饿死几百毫秒。',
                en: 'Look at row two: the adaptive mutex shines by keeping P99 tail latency bounded through orderly wait-queue wakeups instead of starving individual threads.',
              },
            },
          ],
        },
        {
          id: 'm2-c1-3',
          chapterId: 'm2-ch1',
          schemaTargetId: 'm2-cell-9',
          conciseTitle: {
            zh: '传统读写锁容易引发写者饥饿',
            en: 'Classic reader-writer locks risk writer starvation',
          },
          detailedBody: {
            zh: '如果读写锁采用读优先策略，源源不断到达的新读者可以持续插队共享锁，导致排在队列里的写者迟迟拿不到独占权，写请求延迟飙升。',
            en: 'Reader-biased RW locks allow newly arriving readers to barge past waiting writers continuously, starving write operations under sustained read traffic.',
          },
          anchors: [
            {
              id: 'm2-a1-3-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(12, 5),
              endMs: t(12, 26),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '第三行右下角这个写者饥饿是经典考题，只要读流量不断...',
                en: 'That writer starvation cell in row three is classic: as long as readers...',
              },
              fullQuote: {
                zh: '第三行右下角这个写者饥饿是经典考题，只要读流量不断涌入，写线程可能被活活饿死，生产库一般要配写者优先或排队读写锁。',
                en: 'That writer starvation cell in row three is classic: as long as readers keep arriving, writers can starve indefinitely unless the lock uses writer preference or queueing.',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'm2-ch2',
      index: 2,
      title: {
        zh: '自旋优化演进与用户态自旋实践',
        en: 'Spinlock Refinements & User-Space Spinning',
      },
      startMs: t(13, 0),
      endMs: t(25, 30),
      summary: {
        zh: '从朴素测试并置位出发，依次引入指数退避、MCS 排队自旋，并讨论应用层手写用户态自旋锁的收益。',
        en: 'Traces naive test-and-set through exponential backoff, MCS queue locks, and custom user-space spinning.',
      },
      schema: {
        kind: 'flow',
        title: {
          zh: '降低缓存行抖动的自旋演进链',
          en: 'Reducing Cache-Line Bouncing',
        },
        subtitle: {
          zh: '注意第三步关于用户态手写自旋的工程建议，在问答环节被讲者主动修正',
          en: 'Step 3 on hand-rolled user-space spinlocks is revised by the speaker during live Q&A',
        },
        nodes: [
          {
            id: 'm2-n2-1',
            stepTag: { zh: '瓶颈 01', en: 'Bottleneck 01' },
            title: { zh: '缓存行跨核乒乓', en: 'Cache-Line Bouncing' },
            caption: {
              zh: '多核同时原子写同一锁字导致总线风暴',
              en: 'Cores hammering one lock word saturate coherency bus',
            },
            edgeLabelToNext: { zh: '分散监听', en: 'Localize spins' },
          },
          {
            id: 'm2-n2-2',
            stepTag: { zh: '改进 02', en: 'Refinement 02' },
            title: { zh: 'MCS 本地队列自旋', en: 'MCS Local Queue Spin' },
            caption: {
              zh: '每个核心只轮询私有节点，消除全局失效',
              en: 'Each core spins on its own cache line cleanly',
            },
            edgeLabelToNext: { zh: '应用层落地', en: 'User-space use' },
          },
          {
            id: 'm2-n2-3',
            stepTag: { zh: '建议 03', en: 'Advice 03' },
            title: { zh: '高并发服务手写用户态自旋', en: 'Hand-Roll User-Space Spin' },
            caption: {
              zh: '在延迟敏感的应用热路径用原子自旋替代系统互斥锁',
              en: 'Replace OS mutexes with atomic spinloops on hot paths',
            },
          },
        ],
      },
      claims: [
        {
          id: 'm2-c2-1',
          chapterId: 'm2-ch2',
          schemaTargetId: 'm2-n2-1',
          conciseTitle: {
            zh: '朴素自旋锁引发缓存一致性风暴',
            en: 'Naive spinlocks trigger cache coherency storms',
          },
          detailedBody: {
            zh: '在 64 核服务器上，如果所有等待线程都对同一个内存地址反复执行原子交换指令，MESI 协议会在核心之间疯狂来回搬运同一条缓存行，即便持锁者想释放锁也会被总线拥堵拖慢。',
            en: 'On a 64-core server, dozens of cores executing atomic exchange on one address force MESI invalidations across the interconnect, slowing down even the lock holder trying to release the lock.',
          },
          anchors: [
            {
              id: 'm2-a2-1-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(14, 15),
              endMs: t(14, 38),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '一旦核数超过 16 核，朴素自旋锁最致命的不是算力浪费而是总线...',
                en: 'Past 16 cores, naive spinlocks hurt most by flooding the coherency bus...',
              },
              fullQuote: {
                zh: '一旦核数超过 16 核，朴素自旋锁最致命的不是算力浪费而是缓存行跨核乒乓，每次释放锁都会引发几十个核心同时争抢写权限。',
                en: 'Past 16 cores, naive spinlocks hurt most through cache-line bouncing: every unlock triggers dozens of cores fighting for exclusive ownership at once.',
              },
            },
          ],
        },
        {
          id: 'm2-c2-2',
          chapterId: 'm2-ch2',
          schemaTargetId: 'm2-n2-2',
          conciseTitle: {
            zh: 'MCS 排队锁让各核心在私有缓存行自旋',
            en: 'MCS queue locks spin strictly on per-core local lines',
          },
          detailedBody: {
            zh: 'MCS 锁把等待线程串成显式链表，每个线程只在自己栈上的局部标志位上自旋，解锁时前驱核心精准修改后继节点标志，把缓存行失效从 O(N) 降为 O(1)。',
            en: 'MCS locks link waiters into an explicit queue where each core spins only on its own private flag. Unlock hands ownership directly to the next node, cutting invalidations from O(N) to O(1).',
          },
          anchors: [
            {
              id: 'm2-a2-2-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(16, 40),
              endMs: t(17, 4),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: 'MCS 锁的精妙之处在于每人盯自己的缓存行，解锁只需通知下一位...',
                en: 'MCS locks work by giving every waiter its own cache line to poll...',
              },
              fullQuote: {
                zh: 'MCS 锁的精妙之处在于每人盯自己的缓存行，解锁只需通知下一位，彻底消灭了释放瞬间的所有核心惊群效应。',
                en: 'MCS locks work by giving every waiter its own cache line to poll; unlock signals only the immediate successor, eliminating thundering-herd invalidations.',
              },
            },
            {
              id: 'm2-a2-2-ex',
              relation: 'example',
              tier: 'elaboration',
              startMs: t(17, 20),
              endMs: t(17, 42),
              offsetFromOriginMs: t(0, 40),
              verbatimLead: {
                zh: 'Linux 内核里的 qspinlock 就是基于这套排队思路演化出来的...',
                en: 'Linux kernel qspinlock evolved directly from this queued spinning idea...',
              },
              fullQuote: {
                zh: 'Linux 内核里的 qspinlock 就是基于这套排队思路演化出来的，把锁字压缩在 32 位里同时保留了每核本地自旋。',
                en: 'Linux kernel qspinlock evolved directly from this queued spinning idea, packing the lock word into 32 bits while keeping per-CPU local spinning.',
              },
            },
          ],
        },
        {
          id: 'm2-c2-3',
          chapterId: 'm2-ch2',
          schemaTargetId: 'm2-n2-3',
          conciseTitle: {
            zh: '延迟敏感服务可在用户态手写自旋锁',
            en: 'Latency-critical apps can hand-roll user-space spinlocks',
          },
          detailedBody: {
            zh: '在介绍完内核排队自旋之后，讲者演示了一段十几行的 C++ 原子标志位自旋代码，提到在极短临界区的内存引擎里，用用户态手写自旋替换标准库 mutex 能压低平均延迟。',
            en: 'Following kernel queue locks, the speaker walks through a 15-line C++ atomic spinloop, noting that replacing std::mutex on ultra-short in-memory hot paths can shave average latency.',
          },
          anchors: [
            {
              id: 'm2-a2-3-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(18, 25),
              endMs: t(18, 48),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '如果你们写超低延迟内存索引，在用户态自己包一层轻量自旋锁...',
                en: 'If you write an ultra-low-latency in-memory index, a user-space spinlock...',
              },
              fullQuote: {
                zh: '如果你们写超低延迟内存索引，在用户态自己包一层轻量自旋锁替换掉默认互斥锁，能把平均加锁延迟压到 20 纳秒以内，收益很可观。',
                en: 'If you write an ultra-low-latency in-memory index, replacing default mutexes with a lightweight user-space spinlock can push average acquire latency under 20 nanoseconds.',
              },
            },
            {
              id: 'm2-a2-3-corr',
              relation: 'correction',
              tier: 'alert',
              startMs: t(36, 10),
              endMs: t(36, 38),
              offsetFromOriginMs: t(17, 45),
              contextBridge: {
                zh: '课末问答环节 · 讨论大小核异构 CPU 与优先级反转后讲者撤回建议',
                en: 'Live Q&A · Retracted after discussion of hybrid P/E cores & priority inversion',
              },
              verbatimLead: {
                zh: '谢谢提醒，我得收回第 18 分钟鼓励大家在用户态手写自旋锁的话...',
                en: 'Good catch - I need to walk back my minute-18 encouragement of user spinlocks...',
              },
              fullQuote: {
                zh: '谢谢提醒，我得收回第 18 分钟鼓励大家在用户态手写自旋锁的话。用户态代码没法关闭抢占，在现代大小核异构处理器上，高优先级大核自旋会把低优先级小核上的持锁者饿死，造成严重优先级反转；生产环境一律应该用操作系统提供的 futex 自适应互斥锁。',
                en: 'Good catch - I need to walk back my minute-18 encouragement of hand-rolled user-space spinlocks. User code cannot disable preemption, and on hybrid P/E-core CPUs a spinning high-priority thread starves a low-priority lock holder via priority inversion. Production apps should rely on OS futex-backed adaptive mutexes instead.',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'm2-ch3',
      index: 3,
      title: {
        zh: '云端虚拟化抢占实测与问答',
        en: 'Cloud VM Preemption Profiling & Live Q&A',
      },
      startMs: t(25, 30),
      endMs: t(38, 0),
      summary: {
        zh: '实测超售虚拟机中的锁持有者抢占现象，并总结生产级并发锁的底线原则。',
        en: 'Profiles lock-holder preemption on oversubscribed VMs and distills production locking guardrails.',
      },
      schema: {
        kind: 'flow',
        title: {
          zh: '虚拟化故障链与生产底线',
          en: 'VM Preemption Failure Chain',
        },
        subtitle: {
          zh: '解释前两章在真实云环境与现代调度器下为何需要限定条件',
          en: 'Explains the real-world boundaries behind the distant badges in Chapters 1 and 2',
        },
        nodes: [
          {
            id: 'm2-n3-1',
            stepTag: { zh: '现象 01', en: 'Fault 01' },
            title: { zh: '持锁 vCPU 被宿主机换出', en: 'Holder vCPU Preempted' },
            caption: {
              zh: '客体机无感知，其余 vCPU 满载空转整片时间',
              en: 'Guest OS stays blind while peer vCPUs burn whole slices',
            },
            edgeLabelToNext: { zh: '底线原则', en: 'Guardrail' },
          },
          {
            id: 'm2-n3-2',
            stepTag: { zh: '底线 02', en: 'Rule 02' },
            title: { zh: '用户态统一用内核感知锁', en: 'Use OS-Aware Locks' },
            caption: {
              zh: '交给内核 futex 处理抢占与优先级继承',
              en: 'Let kernel futex handle preemption and priority inheritance',
            },
          },
        ],
      },
      claims: [
        {
          id: 'm2-c3-1',
          chapterId: 'm2-ch3',
          schemaTargetId: 'm2-n3-1',
          conciseTitle: {
            zh: '锁持有者抢占是云主机自旋失速的根因',
            en: 'Lock-holder preemption causes VM spinlock stalls',
          },
          detailedBody: {
            zh: '当宿主机物理核超售时，Hypervisor 随时可能挂起正拿着自旋锁的虚拟核。客体机里的其余虚拟核对此一无所知，持续空转消耗配额，导致有效吞吐断崖式下跌。',
            en: 'When physical hosts oversubscribe vCPUs, the hypervisor can deschedule the lock-holding vCPU without notifying the guest. Peer vCPUs keep burning cycles uselessly until the holder is rescheduled.',
          },
          anchors: [
            {
              id: 'm2-a3-1-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(29, 50),
              endMs: t(30, 18),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '学术界给这个现象起了个专有名词，叫锁持有者抢占 LHP...',
                en: 'Systems papers call this failure mode Lock-Holder Preemption, or LHP...',
              },
              fullQuote: {
                zh: '学术界给这个现象起了个专有名词，叫锁持有者抢占 LHP，它是虚拟化环境下无脑用自旋锁的最大元凶。',
                en: 'Systems papers call this failure mode Lock-Holder Preemption, or LHP, and it is the primary hazard of blind spinning inside virtualized environments.',
              },
            },
          ],
        },
        {
          id: 'm2-c3-2',
          chapterId: 'm2-ch3',
          schemaTargetId: 'm2-n3-2',
          conciseTitle: {
            zh: '应用代码应依赖内核感知的自适应锁',
            en: 'Applications should rely on OS-aware adaptive locks',
          },
          detailedBody: {
            zh: '只有操作系统内核掌握线程调度、CPU 核型差异与优先级继承全貌。应用层默认采用 futex 或系统自适应互斥锁，既能享受无争用快路径，又能避免抢占死锁。',
            en: 'Only the kernel sees scheduler state, heterogeneous core types, and priority inheritance. Relying on OS futex-backed mutexes keeps the uncontended fast path while staying safe under preemption.',
          },
          anchors: [
            {
              id: 'm2-a3-2-orig',
              relation: 'origin',
              tier: 'origin',
              startMs: t(36, 45),
              endMs: t(37, 10),
              offsetFromOriginMs: 0,
              verbatimLead: {
                zh: '所以总结成一句话：内核态关抢占后可用自旋，用户态交给 futex...',
                en: 'In one sentence: spin only in preemption-disabled kernel code; use futex in user space...',
              },
              fullQuote: {
                zh: '所以总结成一句话：内核态关抢占后可以用自旋锁，用户态应用老老实实交给操作系统 futex 自适应锁。',
                en: 'In one sentence: spinlocks belong in preemption-disabled kernel paths, while user-space applications belong on OS futex adaptive locks.',
              },
            },
          ],
        },
      ],
    },
  ],
  transcript: [
    {
      id: 'm2-t01',
      startMs: t(7, 40),
      endMs: t(8, 8),
      speaker: { zh: '陈默', en: 'Prof. Chen' },
      text: {
        zh: '我们先在裸机 8 核服务器上跑一组微基准，把自旋锁、自适应互斥锁、读写锁的短临界区数据填进黑板上的矩阵。',
        en: 'Let us start on a bare-metal 8-core box and fill the board matrix for spinlocks, adaptive mutexes, and reader-writer locks.',
      },
    },
    {
      id: 'm2-t02',
      startMs: t(8, 10),
      endMs: t(8, 34),
      speaker: { zh: '陈默', en: 'Prof. Chen' },
      text: {
        zh: '先看矩阵左上角，几十纳秒的短临界区里自旋锁吞吐量一骑绝尘，因为它彻底避开了内核线程切换，等上几十个时钟周期锁就到手了。',
        en: 'Look at the top-left cell: for 50ns critical sections spinlocks dominate throughput because they avoid kernel context switches entirely and acquire the lock within dozens of cycles.',
      },
    },
    {
      id: 'm2-t03',
      startMs: t(9, 5),
      endMs: t(9, 26),
      speaker: { zh: '陈默', en: 'Prof. Chen' },
      text: {
        zh: '一次完整的线程挂起加重新调度大概要花三到五微秒，比持锁本身还长一百倍，所以不睡眠反而是最省资源的。',
        en: 'One full park-and-wake cycle takes 3 to 5 microseconds, roughly 100x longer than holding the lock itself, so staying awake saves cycles.',
      },
    },
    {
      id: 'm2-t04',
      startMs: t(10, 40),
      endMs: t(11, 2),
      speaker: { zh: '陈默', en: 'Prof. Chen' },
      text: {
        zh: '对比看第二行，自适应互斥锁最值钱的特性是高争用下尾延迟稳，按等待队列有序唤醒，不会出现单个线程饿死几百毫秒。',
        en: 'Look at row two: the adaptive mutex shines by keeping P99 tail latency bounded through orderly wait-queue wakeups instead of starving individual threads.',
      },
    },
    {
      id: 'm2-t05',
      startMs: t(12, 5),
      endMs: t(12, 26),
      speaker: { zh: '陈默', en: 'Prof. Chen' },
      text: {
        zh: '第三行右下角这个写者饥饿是经典考题，只要读流量不断涌入，写线程可能被活活饿死，生产库一般要配写者优先或排队读写锁。',
        en: 'That writer starvation cell in row three is classic: as long as readers keep arriving, writers can starve indefinitely unless the lock uses writer preference or queueing.',
      },
    },
    {
      id: 'm2-t06',
      startMs: t(14, 15),
      endMs: t(14, 38),
      speaker: { zh: '陈默', en: 'Prof. Chen' },
      text: {
        zh: '一旦核数超过 16 核，朴素自旋锁最致命的不是算力浪费而是缓存行跨核乒乓，每次释放锁都会引发几十个核心同时争抢写权限。',
        en: 'Past 16 cores, naive spinlocks hurt most through cache-line bouncing: every unlock triggers dozens of cores fighting for exclusive ownership at once.',
      },
    },
    {
      id: 'm2-t07',
      startMs: t(16, 40),
      endMs: t(17, 4),
      speaker: { zh: '陈默', en: 'Prof. Chen' },
      text: {
        zh: 'MCS 锁的精妙之处在于每人盯自己的缓存行，解锁只需通知下一位，彻底消灭了释放瞬间的所有核心惊群效应。',
        en: 'MCS locks work by giving every waiter its own cache line to poll; unlock signals only the immediate successor, eliminating thundering-herd invalidations.',
      },
    },
    {
      id: 'm2-t08',
      startMs: t(17, 20),
      endMs: t(17, 42),
      speaker: { zh: '陈默', en: 'Prof. Chen' },
      text: {
        zh: 'Linux 内核里的 qspinlock 就是基于这套排队思路演化出来的，把锁字压缩在 32 位里同时保留了每核本地自旋。',
        en: 'Linux kernel qspinlock evolved directly from this queued spinning idea, packing the lock word into 32 bits while keeping per-CPU local spinning.',
      },
    },
    {
      id: 'm2-t09',
      startMs: t(18, 25),
      endMs: t(18, 48),
      speaker: { zh: '陈默', en: 'Prof. Chen' },
      text: {
        zh: '如果你们写超低延迟内存索引，在用户态自己包一层轻量自旋锁替换掉默认互斥锁，能把平均加锁延迟压到 20 纳秒以内，收益很可观。',
        en: 'If you write an ultra-low-latency in-memory index, replacing default mutexes with a lightweight user-space spinlock can push average acquire latency under 20 nanoseconds.',
      },
    },
    {
      id: 'm2-t10',
      startMs: t(29, 25),
      endMs: t(29, 48),
      speaker: { zh: '陈默', en: 'Prof. Chen' },
      text: {
        zh: '前半节课所有数据都是物理裸机测的。现在我把同一份二进制原封不动拷到云厂商的共享宿主机虚拟机里跑一遍。',
        en: 'Every chart so far ran on bare metal. Now let us copy the exact same binary onto a shared-host cloud VM and run it again.',
      },
    },
    {
      id: 'm2-t11',
      startMs: t(29, 50),
      endMs: t(30, 18),
      speaker: { zh: '陈默', en: 'Prof. Chen' },
      text: {
        zh: '学术界给这个现象起了个专有名词，叫锁持有者抢占 LHP，它是虚拟化环境下无脑用自旋锁的最大元凶。',
        en: 'Systems papers call this failure mode Lock-Holder Preemption, or LHP, and it is the primary hazard of blind spinning inside virtualized environments.',
      },
    },
    {
      id: 'm2-t12',
      startMs: t(30, 20),
      endMs: t(30, 48),
      speaker: { zh: '陈默', en: 'Prof. Chen' },
      text: {
        zh: '把刚才第 8 分钟的吞吐表拿到超售云主机上，自旋锁吞吐会直接雪崩掉九成。因为一旦持锁线程所在的虚拟 CPU 被宿主机抢占换出，其余核心上的自旋线程就会白白空转整整一个时间片，全卡死在锁持有者抢占问题上。',
        en: 'Take that minute-8 throughput table onto an oversubscribed cloud VM and spinlock throughput collapses by 90%. If the hypervisor preempts the vCPU holding the lock, every other spinning vCPU burns its entire time slice waiting for a descheduled holder.',
      },
    },
    {
      id: 'm2-t13',
      startMs: t(35, 40),
      endMs: t(36, 8),
      speaker: { zh: '课堂提问', en: 'Student Q&A' },
      text: {
        zh: '老师，我记得 Linus 曾专门发邮件痛批过用户态手写自旋锁，特别是在现在大小核异构 CPU 上会引发优先级反转，那您前面建议写内存索引时自己包用户态自旋还安全吗？',
        en: 'Professor, Linus once famously warned against user-space spinlocks because of priority inversion on modern schedulers and hybrid cores. Is your earlier suggestion to hand-roll one for an in-memory index still safe?',
      },
    },
    {
      id: 'm2-t14',
      startMs: t(36, 10),
      endMs: t(36, 38),
      speaker: { zh: '陈默', en: 'Prof. Chen' },
      text: {
        zh: '谢谢提醒，我得收回第 18 分钟鼓励大家在用户态手写自旋锁的话。用户态代码没法关闭抢占，在现代大小核异构处理器上，高优先级大核自旋会把低优先级小核上的持锁者饿死，造成严重优先级反转；生产环境一律应该用操作系统提供的 futex 自适应互斥锁。',
        en: 'Good catch - I need to walk back my minute-18 encouragement of hand-rolled user-space spinlocks. User code cannot disable preemption, and on hybrid P/E-core CPUs a spinning high-priority thread starves a low-priority lock holder via priority inversion. Production apps should rely on OS futex-backed adaptive mutexes instead.',
      },
    },
    {
      id: 'm2-t15',
      startMs: t(36, 45),
      endMs: t(37, 10),
      speaker: { zh: '陈默', en: 'Prof. Chen' },
      text: {
        zh: '所以总结成一句话：内核态关抢占后可以用自旋锁，用户态应用老老实实交给操作系统 futex 自适应锁。',
        en: 'In one sentence: spinlocks belong in preemption-disabled kernel paths, while user-space applications belong on OS futex adaptive locks.',
      },
    },
  ],
  studyTasks: [
    {
      id: 'm2-task-t1',
      kind: 't1',
      targetClaimId: 'm2-c1-1',
      prompt: {
        zh: 'T1（适用条件）对比矩阵指出自旋锁在短临界区吞吐极高，讲者在后半程补充它在什么环境下会暴跌九成？',
        en: 'T1 (Condition) In which deployment environment did the speaker warn spinlock throughput drops by 90%?',
      },
      options: [
        { id: 'a', label: { zh: '超售云主机虚拟机中发生持锁 vCPU 被宿主机抢占时', en: 'Oversubscribed cloud VMs when the hypervisor preempts the lock-holding vCPU' } },
        { id: 'b', label: { zh: '8 核物理裸机且临界区只有 50 纳秒时', en: '8-core bare-metal hosts with 50ns critical sections' } },
        { id: 'c', label: { zh: '当读写锁采用读者优先策略时', en: 'Whenever an RWLock uses reader bias' } },
      ],
      correctOptionId: 'a',
    },
    {
      id: 'm2-task-t2',
      kind: 't2',
      targetClaimId: 'm2-c2-3',
      twoStepConfidence: true,
      prompt: {
        zh: 'T2（陷阱核实 · 测 H5）判断讲者的最终立场：在生产级高并发用户态服务里，讲者是否赞成自己手写用户态自旋锁替代系统互斥锁？',
        en: 'T2 (Trap Check · H5) Does the speaker ultimately endorse hand-rolling user-space spinlocks in production services?',
      },
      options: [
        { id: 'yes', label: { zh: '赞成：用户态自旋能把延迟压到 20 纳秒以内，收益显著', en: 'Yes: user-space spinlocks keep latency under 20ns safely' } },
        { id: 'no', label: { zh: '反对：讲者在问答中收回了该建议，指出会引发优先级反转，改推 futex 自适应锁', en: 'No: speaker retracted this in Q&A due to priority inversion, recommending OS futex mutexes' } },
        { id: 'unclear', label: { zh: '讲者未对用户态自旋表态', en: 'Speaker took no position on user-space spinning' } },
      ],
      correctOptionId: 'no',
    },
    {
      id: 'm2-task-t3',
      kind: 't3',
      targetClaimId: 'm2-c2-2',
      prompt: {
        zh: 'T3（引用核对）讲者提到 Linux 内核里哪个同步原语基于 MCS 排队自旋思路演化而来？',
        en: 'T3 (Citation Check) Which Linux kernel lock did the speaker cite as evolving from MCS queue spinning?',
      },
      options: [
        { id: 'a', label: { zh: 'qspinlock', en: 'qspinlock' } },
        { id: 'b', label: { zh: 'reader-biased rwlock', en: 'reader-biased rwlock' } },
        { id: 'c', label: { zh: 'pthread_cond', en: 'pthread_cond' } },
      ],
      correctOptionId: 'a',
    },
    {
      id: 'm2-task-t4',
      kind: 't4',
      targetClaimId: 'm2-c1-3',
      prompt: {
        zh: 'T4（无修正对照）为什么传统读优先读写锁在高读流量下存在风险？',
        en: 'T4 (Unamended Control) Why do classic reader-biased RW locks pose a hazard under sustained read load?',
      },
      options: [
        { id: 'a', label: { zh: '源源不断的新读者持续插队会导致写者饥饿', en: 'Continuous arriving readers can starve waiting writers indefinitely' } },
        { id: 'b', label: { zh: '读者不能并发进入临界区', en: 'Readers cannot enter the critical section concurrently' } },
        { id: 'c', label: { zh: '会强制禁用所有 CPU 缓存行', en: 'They disable CPU cache lines completely' } },
      ],
      correctOptionId: 'a',
    },
  ],
}

export const BUILT_IN_LECTURES: Lecture[] = [LECTURE_M1, LECTURE_M2]
