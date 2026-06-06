/**
 * LevelData - 波次系统关卡配置
 * 每个关卡由多个波次组成，每波有特定的敌人组合
 * 采用 4-6-8-10-8 波次结构，强化发育感与高压决战
 */

const LevelData = {
  stages: {
    // ========================================
    // Stage 1: 丛林遭遇 - 基础与发育 (4波)
    // 核心考题: 基础猫能否在 1:1 对撞中胜过基础狗？
    // ========================================
    1: {
      name: 'Training Day',
      nameZh: '训练日',
      intel: '情报：敌方仅有基础犬类单位，适合新手练习。',
      question: '你能维持前线不崩溃吗？',
      visualTheme: {
        sky: ['#87CEEB', '#E0F6FF'],
        ground: '#7cfc00',
        particles: 'basic'
      },
      modifiers: {},
      enemyStatMultiplier: 1.0,
      startingMoney: 150,
      moneyGenRate: 15,
      waves: [
        {
          title: '第一步',
          enemies: [{ type: 'dog', count: 6, interval: 100 }],
          waveReward: 100,
          autoStartDelay: 0
        },
        {
          title: '疾速试探',
          enemies: [{ type: 'snake', count: 8, interval: 80 }],
          waveReward: 120,
          autoStartDelay: 300
        },
        {
          title: '压力测试',
          enemies: [
            { type: 'dog', count: 12, interval: 60 },
            { type: 'hippo', count: 1, delay: 400 }
          ],
          waveReward: 200,
          autoStartDelay: 400
        },
        {
          title: '最终试炼',
          type: 'boss',
          enemies: [
            { type: 'dog', count: 20, interval: 40 },
            { type: 'hippo', count: 2, interval: 500, delay: 300 }
          ],
          waveReward: 300,
          autoStartDelay: 400,
          isFinal: true
        }
      ]
    },

    // ========================================
    // Stage 2: 蜂鸣预警 - 引入自爆机制 (6波)
    // 核心考题: 面对高伤害自爆，你懂得“排雷”吗？
    // ========================================
    2: {
      name: 'Bee Alert',
      nameZh: '蜂鸣预警',
      intel: '情报：敌方派出了自爆蜂！建议用基础猫排雷。',
      question: '你能保护好你的主力部队吗？',
      visualTheme: {
        sky: ['#FF8C00', '#4B0082'],
        ground: '#EDC9AF',
        particles: 'heatwave'
      },
      modifiers: { moveSpeedMultiplier: 1.1 },
      enemyStatMultiplier: 1.3,
      startingMoney: 180,
      moneyGenRate: 18,
      waves: [
        {
          title: '先遣队',
          enemies: [{ type: 'dog', count: 8, interval: 80 }],
          waveReward: 100,
          autoStartDelay: 0
        },
        {
          title: '初见蜂鸣',
          enemies: [
            { type: 'dog', count: 6, interval: 100 },
            { type: 'bee', count: 1, delay: 300 }
          ],
          waveReward: 120,
          autoStartDelay: 300
        },
        {
          title: '蛇群突袭',
          enemies: [{ type: 'snake', count: 15, interval: 50 }],
          waveReward: 150,
          autoStartDelay: 300
        },
        {
          title: '蜂群冲锋',
          type: 'rush',
          enemies: [{ type: 'bee', count: 3, interval: 200 }],
          waveReward: 180,
          autoStartDelay: 300
        },
        {
          title: '河马阵线',
          enemies: [
            { type: 'hippo', count: 1 },
            { type: 'dog', count: 10, interval: 80 }
          ],
          waveReward: 200,
          autoStartDelay: 300
        },
        {
          title: '最终攻势',
          type: 'boss',
          enemies: [
            { type: 'hippo', count: 2, interval: 400 },
            { type: 'bee', count: 4, interval: 200, delay: 200 },
            { type: 'dog', count: 15, interval: 60 }
          ],
          waveReward: 400,
          autoStartDelay: 400,
          isFinal: true
        }
      ]
    },

    // ========================================
    // Stage 3: 钢铁防线 - 引入次数护盾 (8波)
    // 核心考题: 面对无法被一击必杀的护盾，你需要更高的攻击频率。
    // ========================================
    3: {
      name: 'Iron Defense',
      nameZh: '钢铁防线',
      intel: '情报：敌方护盾蟹拥有次数护盾。狂战士是它们的天敌。',
      question: '你能击穿这层铁甲吗？',
      visualTheme: {
        sky: ['#4a0000', '#000000'],
        ground: '#333333',
        particles: 'fire'
      },
      modifiers: { damageMultiplier: 1.1 },
      enemyStatMultiplier: 1.8,
      startingMoney: 200,
      moneyGenRate: 20,
      waves: [
        {
          title: '重装先锋',
          enemies: [{ type: 'crab', count: 1, delay: 100 }],
          waveReward: 120,
          autoStartDelay: 0
        },
        {
          title: '盾与矛',
          enemies: [
            { type: 'crab', count: 2, interval: 300 },
            { type: 'dog', count: 10, interval: 80 }
          ],
          waveReward: 150,
          autoStartDelay: 300
        },
        {
          title: '疾风蛇群',
          enemies: [{ type: 'snake', count: 20, interval: 40 }],
          waveReward: 180,
          autoStartDelay: 300
        },
        {
          title: '护盾蜂鸣',
          enemies: [
            { type: 'crab', count: 2, interval: 200 },
            { type: 'bee', count: 2, delay: 300 }
          ],
          waveReward: 200,
          autoStartDelay: 300
        },
        {
          title: '河马突进',
          enemies: [
            { type: 'hippo', count: 1 },
            { type: 'crab', count: 2, delay: 200 }
          ],
          waveReward: 220,
          autoStartDelay: 300
        },
        {
          title: '双重压力',
          enemies: [
            { type: 'crab', count: 3, interval: 200 },
            { type: 'bee', count: 3, interval: 150, delay: 200 }
          ],
          waveReward: 250,
          autoStartDelay: 300
        },
        {
          title: '钢铁洪流',
          enemies: [
            { type: 'crab', count: 4, interval: 150 },
            { type: 'dog', count: 15, interval: 60 }
          ],
          waveReward: 300,
          autoStartDelay: 300
        },
        {
          title: '最终堡垒',
          type: 'boss',
          enemies: [
            { type: 'crab', count: 5, interval: 150 },
            { type: 'hippo', count: 2, interval: 500, delay: 300 },
            { type: 'bee', count: 4, interval: 200, delay: 200 }
          ],
          waveReward: 500,
          autoStartDelay: 400,
          isFinal: true
        }
      ]
    },

    // ========================================
    // Stage 4: 治愈之光 - 引入治疗续航 (10波)
    // 核心考题: 如果不先解决后排的医疗兔，前排将是不死之身。
    // ========================================
    4: {
      name: 'Healing Light',
      nameZh: '治愈之光',
      intel: '情报：医疗兔会持续治疗周围友军。必须用刺客猫绕后切除它们！',
      question: '你能切断敌人的补给线吗？',
      visualTheme: {
        sky: ['#2F4F4F', '#191970'],
        ground: '#556B2F',
        particles: 'wind'
      },
      modifiers: { windForce: 0.05 },
      enemyStatMultiplier: 2.5,
      startingMoney: 250,
      moneyGenRate: 22,
      waves: [
        {
          title: '不死小队',
          enemies: [
            { type: 'hippo', count: 1 },
            { type: 'rabbit', count: 1, delay: 100 }
          ],
          waveReward: 150,
          autoStartDelay: 0
        },
        {
          title: '远程压制',
          enemies: [
            { type: 'elephant', count: 1 },
            { type: 'dog', count: 10, interval: 80 }
          ],
          waveReward: 180,
          autoStartDelay: 300
        },
        {
          title: '盾与奶',
          enemies: [
            { type: 'crab', count: 2, interval: 300 },
            { type: 'rabbit', count: 1, delay: 200 }
          ],
          waveReward: 200,
          autoStartDelay: 300
        },
        {
          title: '蜂鸣医疗',
          enemies: [
            { type: 'bee', count: 3, interval: 200 },
            { type: 'rabbit', count: 1, delay: 300 }
          ],
          waveReward: 220,
          autoStartDelay: 300
        },
        {
          title: '蛇群风暴',
          enemies: [{ type: 'snake', count: 25, interval: 40 }],
          waveReward: 250,
          autoStartDelay: 300
        },
        {
          title: '重装狙击',
          enemies: [
            { type: 'hippo', count: 1 },
            { type: 'elephant', count: 1, delay: 400 }
          ],
          waveReward: 280,
          autoStartDelay: 300
        },
        {
          title: '钢铁医护',
          enemies: [
            { type: 'crab', count: 3, interval: 200 },
            { type: 'rabbit', count: 2, interval: 300, delay: 200 }
          ],
          waveReward: 320,
          autoStartDelay: 300
        },
        {
          title: '自爆干扰',
          enemies: [
            { type: 'bee', count: 5, interval: 150 },
            { type: 'elephant', count: 1, delay: 500 }
          ],
          waveReward: 350,
          autoStartDelay: 300
        },
        {
          title: '全面压进',
          enemies: [
            { type: 'hippo', count: 2, interval: 500 },
            { type: 'crab', count: 3, interval: 200, delay: 200 },
            { type: 'dog', count: 20, interval: 50 }
          ],
          waveReward: 400,
          autoStartDelay: 300
        },
        {
          title: '终极阵地',
          type: 'boss',
          enemies: [
            { type: 'elephant', count: 3, interval: 600 },
            { type: 'rabbit', count: 2, interval: 400, delay: 200 },
            { type: 'crab', count: 4, interval: 200, delay: 200 },
            { type: 'hippo', count: 2, interval: 500, delay: 300 },
            { type: 'bee', count: 4, interval: 200, delay: 400 }
          ],
          waveReward: 800,
          autoStartDelay: 500,
          isFinal: true
        }
      ]
    },

    // ========================================
    // Stage 5: 全面战争 - 机制大考 (8波)
    // 核心考题: 综合运用所有角色，应对复合机制。
    // ========================================
    5: {
      name: 'Total War',
      nameZh: '全面战争',
      intel: '最高警报：敌方投入了所有机制单位！这是对你全部能力的终极考验。',
      question: '你准备好迎接终极挑战了吗？',
      visualTheme: {
        sky: ['#FFD700', '#FFFFFF'],
        ground: '#F5F5DC',
        particles: 'holy'
      },
      modifiers: { allStatsMultiplier: 1.1 },
      enemyStatMultiplier: 3.5,
      startingMoney: 300,
      moneyGenRate: 25,
      waves: [
        {
          title: '序幕：机制混战',
          enemies: [
            { type: 'bee', count: 4, interval: 150 },
            { type: 'crab', count: 3, interval: 200 },
            { type: 'dog', count: 15, interval: 60 }
          ],
          waveReward: 300,
          autoStartDelay: 0
        },
        {
          title: '中场：不死铁壁',
          enemies: [
            { type: 'crab', count: 4, interval: 200 },
            { type: 'rabbit', count: 2, interval: 400 },
            { type: 'hippo', count: 2, interval: 500 }
          ],
          waveReward: 400,
          autoStartDelay: 400
        },
        {
          title: '狙击时刻',
          enemies: [
            { type: 'elephant', count: 3, interval: 500 },
            { type: 'snake', count: 20, interval: 40 }
          ],
          waveReward: 450,
          autoStartDelay: 400
        },
        {
          title: '蜂鸣风暴',
          type: 'rush',
          enemies: [{ type: 'bee', count: 10, interval: 120 }],
          waveReward: 500,
          autoStartDelay: 400
        },
        {
          title: '重装推进',
          enemies: [
            { type: 'hippo', count: 3, interval: 400 },
            { type: 'crab', count: 4, interval: 200, delay: 200 },
            { type: 'rabbit', count: 2, delay: 400 }
          ],
          waveReward: 600,
          autoStartDelay: 400
        },
        {
          title: '远程覆盖',
          enemies: [
            { type: 'elephant', count: 4, interval: 400 },
            { type: 'rabbit', count: 2, delay: 300 },
            { type: 'dog', count: 20, interval: 50 }
          ],
          waveReward: 700,
          autoStartDelay: 400
        },
        {
          title: '极限生存',
          enemies: [
            { type: 'bee', count: 8, interval: 150 },
            { type: 'snake', count: 30, interval: 30 },
            { type: 'crab', count: 4, interval: 200 }
          ],
          waveReward: 800,
          autoStartDelay: 400
        },
        {
          title: '终章：全明星决战',
          type: 'boss',
          enemies: [
            { type: 'crab', count: 8, interval: 150 },
            { type: 'hippo', count: 3, interval: 400 },
            { type: 'rabbit', count: 4, interval: 300 },
            { type: 'bee', count: 6, interval: 150 },
            { type: 'elephant', count: 6, interval: 400 }
          ],
          waveReward: 1500,
          autoStartDelay: 600,
          isFinal: true
        }
      ]
    }
  },

  getStageConfig(stageId) {
    return this.stages[stageId] || this.stages[1];
  },

  getStageName(stageId) {
    const config = this.getStageConfig(stageId);
    return config.nameZh || config.name;
  },

  getFullStageTitle(stageId) {
    const config = this.getStageConfig(stageId);
    return `Stage ${stageId}: ${config.nameZh || config.name}`;
  },

  getTotalWaves(stageId) {
    const config = this.getStageConfig(stageId);
    return config.waves ? config.waves.length : 0;
  }
};
