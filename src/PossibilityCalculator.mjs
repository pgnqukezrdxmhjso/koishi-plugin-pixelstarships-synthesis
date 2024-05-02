import Tinypool from 'tinypool';
import SynthesisCalculator from "./SynthesisCalculator.mjs";
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

const PossibilityCalculator = {
  tinypool: null,
  getTinypool() {
    if (!PossibilityCalculator.tinypool) {
      PossibilityCalculator.tinypool = new Tinypool({
        filename: new URL('./PossibilityCalculator.mjs', import.meta.url).href
      });
    }
    return PossibilityCalculator.tinypool;
  },
  /**
   *
   * @param {string[]} names
   * @returns {Id[]}
   */
  namesToIds(names) {
    const nameMap = {};
    for (let id in allJson) {
      nameMap[allJson[id].name] = allJson[id];
    }
    const ids = [];
    names.forEach(name => {
      if (nameMap[name]) {
        ids.push(nameMap[name].id)
      }
    });
    return ids;
  },
  /**
   *
   * @returns {SynthesisInfoBackwardsMap}
   */
  synthesisJsonToBackwards() {
    const synthesisMap = {};
    for (let id in synthesisJson) {
      synthesisJson[id].forEach(synthesisInfo => {
        const id1 = synthesisInfo.CharacterDesignId1;
        const id2 = synthesisInfo.CharacterDesignId2;
        if (!synthesisMap[id1]) {
          synthesisMap[id1] = {};
        }
        if (!synthesisMap[id2]) {
          synthesisMap[id2] = {};
        }
        synthesisMap[id1][id2] = synthesisInfo;
        synthesisMap[id2][id1] = synthesisInfo;
      })
    }
    return synthesisMap;
  },
  /**
   *
   * @param {Id[]} materialIds
   * @param {Level} level
   * @returns {Object.<Id,LeveInfo>}
   */
  filterPossessLeveInfoMap({materialIds = [], level}) {
    const levelInfos = levelJson[level];
    const possessLeveInfoMap = {};
    levelInfos.forEach(levelInfo => {
      if (materialIds.includes(levelInfo.id)) {
        possessLeveInfoMap[levelInfo.id] = levelInfo;
      }
    });
    return possessLeveInfoMap;
  },
  /**
   *
   * @param {Id[]} materialIds
   * @param {SynthesisInfoBackwardsMap} synthesisInfoBackwardsMap
   * @param {Level} maxLevel
   * @returns {LevelSynthesisInfosMap}
   */
  allRoute({materialIds, synthesisInfoBackwardsMap, maxLevel}) {
    /**
     * @type {Id[]}
     */
    materialIds = [...materialIds]
    /**
     * @type {LevelSynthesisInfosMap}
     */
    const possessLevelSynthesisInfosMap = {};

    let levelIndex = 1;
    while (levelIndex < maxLevel) {
      let nextLevel = levelIndex;
      nextLevel += nextLevel === 5 ? 2 : 1;

      const possessLeveInfoMap = PossibilityCalculator.filterPossessLeveInfoMap({
        materialIds,
        level: levelIndex
      });
      possessLevelSynthesisInfosMap[nextLevel] = {};
      const possessSynthesisInfosMap = possessLevelSynthesisInfosMap[nextLevel];
      for (let id1 in possessLeveInfoMap) {
        let synthesisInfoMap = synthesisInfoBackwardsMap[id1];
        for (let id2 in possessLeveInfoMap) {
          const synthesisInfo = synthesisInfoMap[id2];
          if (!synthesisInfo) {
            continue;
          }
          const tId = synthesisInfo.ToCharacterDesignId;
          if (!possessSynthesisInfosMap[tId]) {
            possessSynthesisInfosMap[tId] = [];
          } else if (possessSynthesisInfosMap[tId].includes(synthesisInfo)) {
            continue;
          }
          materialIds.push(tId);
          possessSynthesisInfosMap[tId].push(synthesisInfo)
        }
      }
      levelIndex = nextLevel;
    }
    return possessLevelSynthesisInfosMap;
  },
  /**
   *
   * @param {LevelSynthesisInfosMap} allRoutes
   * @param {SynthesisInfo} synthesisInfo
   * @param {Id[]} materialIds
   * @param {Level} nextLevel
   * @returns {SynthesisRouteInfo}
   */
  calculateSynthesisRoute({allRoutes, synthesisInfo, materialIds, nextLevel}) {
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
    const nextLevelSynthesisRoutes = allRoutes[nextLevel] || {};
    const synthesisList1 = nextLevelSynthesisRoutes[id1] || [false];
    const synthesisList2 = nextLevelSynthesisRoutes[id2] || [false];
    synthesisList1.forEach(item1 => {
      synthesisList2.forEach(item2 => {
        let r1 = {routeDepth: 0};
        const mIds = [...materialIds];
        let dIds = [...depleteIds];
        let k = 0;
        if (exist1) {
          k++;
          r1.k = 1;
          r1.exist = true;
        } else if (item1) {
          const res = PossibilityCalculator.calculateSynthesisRoute({
            allRoutes,
            synthesisInfo: item1,
            materialIds: mIds,
            nextLevel: nextLevel - 1
          });
          k += res.k / 2;
          SynthesisCalculator.arrayRm(mIds, res.depleteIds);
          dIds.push(...res.depleteIds)
          r1 = res;
          r1.k = res.k / 2;
          r1.routeDepth = res.routeDepth + 1;
        }

        let r2 = {routeDepth: 0};
        if (exist2) {
          k++;
          r2.k = 1;
          r2.exist = true;
        } else if (item2) {
          const res = PossibilityCalculator.calculateSynthesisRoute({
            allRoutes,
            synthesisInfo: item2,
            materialIds: mIds,
            nextLevel: nextLevel - 1
          });
          k += res.k / 2;
          SynthesisCalculator.arrayRm(mIds, res.depleteIds);
          dIds.push(...res.depleteIds)
          r2 = res;
          r2.k = res.k / 2;
          r2.routeDepth = res.routeDepth + 1;
        }

        if (k < 2) {
          return;
        }

        calculateRoutes.push({
          k,
          routes: [r1, r2],
          routeDepth: Math.max(r1.routeDepth, r2.routeDepth),
          depleteIds: dIds,
        });
      });
    });
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
   * @param {string[]} materialNames
   * @param {Level} targetLevel
   * @returns {LevelSynthesisRouteInfos}
   */
  async calculate({materialNames, targetLevel = 7}) {
    targetLevel = SynthesisCalculator.verifyLevel(targetLevel);
    const computeLevel = targetLevel === 7 ? 5 : targetLevel - 1;
    const materialIds = PossibilityCalculator.namesToIds(materialNames);
    const synthesisInfoBackwardsMap = PossibilityCalculator.synthesisJsonToBackwards();
    const allRoutes = PossibilityCalculator.allRoute({
      materialIds, synthesisInfoBackwardsMap, maxLevel: computeLevel
    });

    const targetLevelInfos = levelJson[targetLevel];
    const targetLevelSynthesisRouteInfos = {};
    const taskList = [];
    for (let i = 0; i < targetLevelInfos.length; i++) {
      const levelInfo = targetLevelInfos[i];
      const synthesisInfos = synthesisJson[levelInfo.id] || [];
      const synthesisRoutes = [];
      targetLevelSynthesisRouteInfos[levelInfo.id] = synthesisRoutes;
      for (const synthesisInfo of synthesisInfos) {
        taskList.push(new Promise(async (resolve, reject) => {
          const res = await PossibilityCalculator.getTinypool().run({
            allRoutes,
            synthesisInfo,
            materialIds: [...materialIds],
            nextLevel: computeLevel
          }, {name: 'calculateSynthesisRoute'});
          if (res.k >= 2) {
            synthesisRoutes.push(res);
          }
          resolve();
        }));
        // const res = PossibilityCalculator.calculateSynthesisRoute({
        //   allRoutes,
        //   synthesisInfo,
        //   materialIds: [...materialIds],
        //   nextLevel: computeLevel
        // });
        // if (res.k < 2) {
        //   return;
        // }
        // synthesisRoutes.push(res);
      }
    }
    await Promise.all(taskList)
    for (let level in targetLevelSynthesisRouteInfos) {
      SynthesisCalculator.prioritySort(targetLevelSynthesisRouteInfos[level]);
    }

    return targetLevelSynthesisRouteInfos;
  },
  /**
   *
   * @param {LevelSynthesisRouteInfos} levelSynthesisRouteInfos
   * @param {number} showMax
   * @param {Level} level
   * @returns {string}
   */
  format({levelSynthesisRouteInfos, showMax = 3, level = 7}) {
    level = SynthesisCalculator.verifyLevel(level) - 1;
    if (!levelSynthesisRouteInfos || levelSynthesisRouteInfos.length < 1) {
      return "no result";
    }
    if (showMax > 6) {
      showMax = 6;
    }
    let content = '';
    for (let id in levelSynthesisRouteInfos) {
      let synthesisRouteInfos = levelSynthesisRouteInfos[id];
      if (synthesisRouteInfos.length < 1) {
        continue;
      }
      content += `target: ${allJson[id]?.name};\n`
      for (let i = 0; i < synthesisRouteInfos.length && i < showMax; i++) {
        const item = synthesisRouteInfos[i];
        content += `    route: `;
        content += SynthesisCalculator.formatSynthesisRouteInfo({
          synthesisRouteInfo: item,
          level
        })
        content += ";\n";
      }
    }
    if (content.trim().length < 1) {
      return "no result";
    }
    return content;
  }
}

export default PossibilityCalculator;
export const calculateSynthesisRoute = PossibilityCalculator.calculateSynthesisRoute
