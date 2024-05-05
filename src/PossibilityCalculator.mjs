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
        if (!synthesisInfoMap) {
          continue;
        }
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
   * @param {string[]} materialNames
   * @param {Level} targetLevel
   * @returns {LevelSynthesisRouteInfos}
   */
  async calculate({materialNames, targetLevel = 7}) {
    targetLevel = SynthesisCalculator.verifyLevel(targetLevel);
    const computeLevel = SynthesisCalculator.verifyLevel(targetLevel - 1);
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
        taskList.push(new Promise(async (resolve) => {
          const res = await SynthesisCalculator.calculateSynthesisRoute({
            levelSynthesisInfosMap: allRoutes,
            synthesisInfo,
            materialIds: [...materialIds],
            allowLack: false,
            nextLevel: computeLevel
          });
          if (!res || res.k < 2) {
            resolve();
            return;
          }
          synthesisRoutes.push(res);
          resolve();
        }));
      }
    }
    await Promise.all(taskList)
    for (let id in targetLevelSynthesisRouteInfos) {
      SynthesisCalculator.prioritySort(targetLevelSynthesisRouteInfos[id]);
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
      return "no result\n";
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
      content += `🌠 ${allJson[id]?.name}`;
      content += showMax === 1 ? ' ' : '\n';
      for (let i = 0; i < synthesisRouteInfos.length && i < showMax; i++) {
        const item = synthesisRouteInfos[i];
        content += `👪 `;
        content += SynthesisCalculator.formatSynthesisRouteInfo({
          synthesisRouteInfo: item,
          level
        })
        content += "\n";
      }
    }
    if (content.trim().length < 1) {
      return "no result\n";
    }
    return content;
  }
}

export default PossibilityCalculator;
