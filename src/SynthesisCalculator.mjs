import Tinypool from "tinypool";
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
/**
 * @type {RoleInfoMap}
 */
const allJson = require("./data/all.json");
/**
 * @type {LeveInfoMap}
 */
const levelJson = require("./data/level.json");
/**
 * @type {SynthesisInfoMap}
 */
const synthesisJson = require("./data/synthesis.json");

const SynthesisCalculator = {
  tinypool: null,
  getTinypool() {
    if (!SynthesisCalculator.tinypool) {
      SynthesisCalculator.tinypool = new Tinypool({
        filename: new URL('./SynthesisCalculator.mjs', import.meta.url).href
      });
    }
    return SynthesisCalculator.tinypool;
  },
  /**
   *
   * @param {string} targetName
   * @param {string[]} materialNames
   * @returns {{targetId:Id, levelIdsMap: LevelIdsMap, materialIds: Id[]}}
   */
  handleLevelJson({targetName, materialNames}) {
    let targetId;
    const levelIdsMap = {}
    let materialIds = []
    for (let level in levelJson) {
      levelIdsMap[level] = []
      for (const item of levelJson[level]) {
        levelIdsMap[level].push(item.id);
        if (targetName === item.name) {
          targetId = item.id;
        }
        if (materialNames.includes(item.name)) {
          materialIds.push(item.id);
        }
      }
    }
    return {
      targetId, levelIdsMap, materialIds
    }
  },
  /**
   *
   * @param {Level} targetId
   * @param {Level} targetLevel
   * @param {Level} minimumLevel
   * @returns {LevelSynthesisInfosMap}
   */
  calculateAll({targetId, targetLevel, minimumLevel}) {
    const targetSynthesisList = synthesisJson[targetId];
    if (!targetSynthesisList) {
      return null;
    }

    /**
     * @type {LevelSynthesisInfosMap}
     */
    const levelSynthesisInfosMap = {[targetLevel]: {[targetId]: targetSynthesisList}};

    let nextLevel;
    for (let level = targetLevel; level >= minimumLevel; level = nextLevel) {
      nextLevel = SynthesisCalculator.verifyLevel(level - 1);
      const currentSynthesisInfosMap = levelSynthesisInfosMap[level];
      levelSynthesisInfosMap[nextLevel] = {};
      const nextSynthesisInfosMap = levelSynthesisInfosMap[nextLevel];

      for (const id in currentSynthesisInfosMap) {
        currentSynthesisInfosMap[id].forEach(synthesisInfo => {
          const id1 = synthesisInfo.CharacterDesignId1;
          const id2 = synthesisInfo.CharacterDesignId2;
          let synthesisList = synthesisJson[id1];
          if (!nextSynthesisInfosMap[id1] && synthesisList) {
            nextSynthesisInfosMap[id1] = synthesisList;
          }
          synthesisList = synthesisJson[id2];
          if (!nextSynthesisInfosMap[id2] && synthesisList) {
            nextSynthesisInfosMap[id2] = synthesisList;
          }
        })
      }
    }
    return levelSynthesisInfosMap;
  },
  /**
   *
   * @param {Id[]} materialIds
   * @param {LevelSynthesisInfosMap} levelSynthesisInfosMap
   * @returns {null|LevelSynthesisInfosMap}
   */
  calculatePossibility({materialIds, levelSynthesisInfosMap}) {
    const levels = [];
    for (let level in levelSynthesisInfosMap) {
      levels.push(level);
    }
    levels.sort((a, b) => a - b);

    const newLevelSynthesisInfosMap = {};
    const newPossessIds = [...materialIds];
    levels.forEach(level => {
      const synthesisInfosMap = levelSynthesisInfosMap[level];
      const newSynthesisInfosMap = {};
      for (const id in synthesisInfosMap) {
        const synthesisInfos = synthesisInfosMap[id];
        const newSynthesisInfos = [];
        for (const synthesisInfo of synthesisInfos) {
          if (newPossessIds.includes(synthesisInfo.CharacterDesignId1) || newPossessIds.includes(synthesisInfo.CharacterDesignId2)) {
            newSynthesisInfos.push(synthesisInfo);
          }
        }
        if (newSynthesisInfos.length > 0) {
          newSynthesisInfosMap[id] = newSynthesisInfos;
          newPossessIds.push(id);
        }
      }
      newLevelSynthesisInfosMap[level] = newSynthesisInfosMap;
    });
    return newLevelSynthesisInfosMap;
  },
  /**
   *
   * @param {any[]} array
   * @param {any[]} rms
   */
  arrayRm(array, rms) {
    rms?.forEach(item => {
      const pi = array.indexOf(item);
      if (pi > -1) {
        array.splice(pi, 1);
      }
    })
  },
  /**
   *
   * @param {SynthesisRouteInfo[]} list
   */
  prioritySort(list) {
    list.sort((a, b) => {
      let diff = b.k - a.k;
      if (diff !== 0) {
        return diff;
      }
      diff = a.routeDepth - b.routeDepth;
      if (diff !== 0) {
        return diff;
      }
      if (b.lackIds && a.lackIds) {
        return a.lackIds.length - b.lackIds.length;
      }
      return b.depleteIds.length - a.depleteIds.length;
    })
  },
  /**
   *
   * @param {LevelSynthesisInfosMap} levelSynthesisInfosMap
   * @param {SynthesisInfo} synthesisInfo
   * @param {Id[]} materialIds
   * @param {boolean} allowLack
   * @param {Level} [nextLevel]
   * @returns {SynthesisRouteInfo}
   */
  async calculateSynthesisRoute({levelSynthesisInfosMap, synthesisInfo, materialIds, allowLack = true, nextLevel}) {
    return await SynthesisCalculator.getTinypool().run({
      levelSynthesisInfosMap,
      synthesisInfo,
      materialIds,
      allowLack,
      nextLevel,
    }, {name: '_calculateSynthesisRoute'})
  },
  /**
   *
   * @param {LevelSynthesisInfosMap} levelSynthesisInfosMap
   * @param {SynthesisInfo} synthesisInfo
   * @param {Id[]} materialIds
   * @param {boolean} allowLack
   * @param {Level} [nextLevel]
   * @returns {SynthesisRouteInfo}
   */
  _calculateSynthesisRoute({levelSynthesisInfosMap, synthesisInfo, materialIds, allowLack = true, nextLevel}) {
    const id1 = synthesisInfo['CharacterDesignId1'];
    const id2 = synthesisInfo['CharacterDesignId2'];

    let depleteIds = [];
    let exist1 = false;
    let exist2 = false;
    if (materialIds.includes(id1)) {
      materialIds.splice(materialIds.indexOf(id1), 1);
      depleteIds.push(id1);
      exist1 = true;
    }
    if (materialIds.includes(id2)) {
      materialIds.splice(materialIds.indexOf(id2), 1);
      depleteIds.push(id2);
      exist2 = true;
    }

    const calculateRoutes = [];
    const nextLevelSynthesisRoutes = levelSynthesisInfosMap[nextLevel] || {};
    const synthesisList1 = nextLevelSynthesisRoutes[id1] || [false];
    const synthesisList2 = nextLevelSynthesisRoutes[id2] || [false];
    for (let i1 in synthesisList1) {
      const item1 = synthesisList1[i1];
      for (let i2 in synthesisList2) {
        const item2 = synthesisList2[i2];

        let r1;
        let lackIds = [];
        const mIds = [...materialIds];
        let dIds = [...depleteIds];
        let k = 0;
        if (exist1) {
          k++;
          r1 = {
            k: 1,
            exist: true,
            routeDepth: 0
          }
        } else if (item1) {
          const res = SynthesisCalculator._calculateSynthesisRoute({
            levelSynthesisInfosMap,
            synthesisInfo: item1,
            materialIds: mIds,
            nextLevel: nextLevel - 1
          });
          SynthesisCalculator.arrayRm(mIds, res.depleteIds);
          dIds.push(...res.depleteIds)
          r1 = res;
          r1.k = res.k / 2;
          r1.routeDepth = res.routeDepth + 1;
          if (allowLack && r1.lackIds) {
            lackIds.push(...r1.lackIds);
          }
          k += r1.k;
        } else if (allowLack) {
          lackIds.push(id1);
        }

        let r2;
        if (exist2) {
          k++;
          r2 = {
            k: 1,
            exist: true,
            routeDepth: 0
          };
        } else if (item2) {
          const res = SynthesisCalculator._calculateSynthesisRoute({
            levelSynthesisInfosMap,
            synthesisInfo: item2,
            materialIds: mIds,
            nextLevel: nextLevel - 1
          });
          SynthesisCalculator.arrayRm(mIds, res.depleteIds);
          dIds.push(...res.depleteIds)
          r2 = res;
          r2.k = res.k / 2;
          r2.routeDepth = res.routeDepth + 1;
          if (allowLack && r2.lackIds) {
            lackIds.push(...r2.lackIds);
          }
          k += r2.k;
        } else if (allowLack) {
          lackIds.push(id2);
        }

        if (!allowLack && k < 2) {
          continue;
        }

        calculateRoutes.push({
          k,
          routes: [r1, r2],
          routeDepth: Math.max(r1?.routeDepth, r2?.routeDepth),
          depleteIds: dIds,
          lackIds,
        })
      }
    }
    SynthesisCalculator.prioritySort(calculateRoutes);
    /**
     * @type {SynthesisRouteInfo}
     */
    let route = calculateRoutes[0];
    if (!route) {
      route = {
        k: 0, routeDepth: 0, depleteIds: []
      };
    }
    route.synthesisInfo = synthesisInfo;
    return route;
  },
  /**
   *
   * @param {string} targetName
   * @param {string[]} materialNames
   * @param {Level} minimumLevel
   * @returns {null|SynthesisRouteInfo[]}
   */
  async calculate({targetName, materialNames = [], minimumLevel = 3}) {
    const {levelIdsMap, targetId, materialIds} = SynthesisCalculator.handleLevelJson({targetName, materialNames})
    if (materialIds.length < 2) {
      return null;
    }

    let targetLevel;
    for (let level in levelIdsMap) {
      if (levelIdsMap[level].includes(targetId)) {
        targetLevel = level;
      }
    }
    if (targetLevel === 6) {
      return null;
    }
    const computeLevel = SynthesisCalculator.verifyLevel(targetLevel - 1);


    const allLevelSynthesisInfosMap = SynthesisCalculator.calculateAll({
      targetId,
      targetLevel,
      minimumLevel
    });

    if (!allLevelSynthesisInfosMap) {
      return null;
    }

    const possibilityLevelSynthesisInfosMap = SynthesisCalculator.calculatePossibility({
      materialIds,
      levelSynthesisInfosMap: allLevelSynthesisInfosMap
    });

    const taskList = possibilityLevelSynthesisInfosMap[targetLevel][targetId].map(synthesisInfo => SynthesisCalculator.calculateSynthesisRoute({
      levelSynthesisInfosMap: possibilityLevelSynthesisInfosMap,
      synthesisInfo,
      materialIds: [...materialIds],
      allowLack: true,
      nextLevel: computeLevel
    }));
    const targetSynthesisRoutes = await Promise.all(taskList);
    SynthesisCalculator.prioritySort(targetSynthesisRoutes);
    return targetSynthesisRoutes;
  },
  /**
   *
   * @param {Level} level
   * @return {Level}
   */
  verifyLevel(level) {
    if (level > 7) {
      level = 7;
    } else if (level === 6) {
      level = 5;
    }
    return level
  },
  /**
   *
   * @param {SynthesisRouteInfo} synthesisRouteInfo
   * @returns {BeautifySynthesisRouteInfo}
   */
  beautifySynthesisRouteInfo(synthesisRouteInfo) {
    const bItem = JSON.parse(JSON.stringify(synthesisRouteInfo));
    bItem.targetName = allJson[synthesisRouteInfo?.synthesisInfo.ToCharacterDesignId]?.name;
    bItem.name1 = allJson[synthesisRouteInfo?.synthesisInfo.CharacterDesignId1]?.name;
    bItem.name2 = allJson[synthesisRouteInfo?.synthesisInfo.CharacterDesignId2]?.name;
    bItem.depleteNames = synthesisRouteInfo.depleteIds?.map(id => allJson[id]?.name);
    bItem.lackNames = synthesisRouteInfo.lackIds?.map(id => allJson[id]?.name);
    return bItem;
  },
  formatSynthesisRouteInfo2({beautifyInfo, nextLevel, index}) {
    let content = beautifyInfo[`name${index + 1}`];
    if (!beautifyInfo?.routes?.[index]) {
      return content;
    }
    if (!beautifyInfo.routes[index].exist) {
      content += `(${nextLevel}`;
      content += SynthesisCalculator.formatSynthesisRouteInfo({
        synthesisRouteInfo: beautifyInfo.routes[index],
        level: nextLevel
      });
      content += `${nextLevel})`;
    }
    return content;
  },
  /**
   *
   * @param {SynthesisRouteInfo} synthesisRouteInfo
   * @param {Level} level
   */
  formatSynthesisRouteInfo({synthesisRouteInfo, level}) {
    level = SynthesisCalculator.verifyLevel(level);
    if (!synthesisRouteInfo) {
      console.log('>>')
    }
    let beautifyInfo = SynthesisCalculator.beautifySynthesisRouteInfo(synthesisRouteInfo);
    let routes = [...synthesisRouteInfo.routes];
    const r = routes?.[1]?.routeDepth < routes?.[0]?.routeDepth;
    let content = "";
    content += SynthesisCalculator.formatSynthesisRouteInfo2({
      index: r ? 1 : 0, beautifyInfo, nextLevel: level - 1
    });
    content += '✨'
    content += SynthesisCalculator.formatSynthesisRouteInfo2({
      index: r ? 0 : 1, beautifyInfo, nextLevel: level - 1
    });

    return content;
  },
  /**
   *
   * @param {SynthesisRouteInfo[]} synthesisRouteInfos
   * @param {number} showMax
   * @returns {string}
   */
  format({synthesisRouteInfos = [], showMax = 10}) {
    if (!synthesisRouteInfos || synthesisRouteInfos.length < 1) {
      return "no result";
    }
    if (showMax > 30) {
      showMax = 60;
    }

    let level;
    for (let l in levelJson) {
      if (levelJson[l].find(item => item.id === synthesisRouteInfos[0].synthesisInfo.ToCharacterDesignId)) {
        level = l - 1;
        break
      }
    }

    let content = '';
    for (let i = 0; i < synthesisRouteInfos.length && i < showMax; i++) {
      const synthesisRouteInfo = synthesisRouteInfos[i];
      let beautifySynthesisRouteInfo = SynthesisCalculator.beautifySynthesisRouteInfo(synthesisRouteInfo);
      content += '👪 ';
      content += SynthesisCalculator.formatSynthesisRouteInfo({
        synthesisRouteInfo,
        level
      })
      if (beautifySynthesisRouteInfo.lackNames && beautifySynthesisRouteInfo.lackNames.length > 0) {
        content += `😡 ${beautifySynthesisRouteInfo.lackNames.join(', ')}`
      }
      content += `\n`;
    }

    return content;
  }
}

export default SynthesisCalculator;
export const _calculateSynthesisRoute = SynthesisCalculator._calculateSynthesisRoute
