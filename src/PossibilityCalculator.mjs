import SynthesisCalculator from "./SynthesisCalculator.mjs";
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
/**
 * @type {RoleInfoMap}
 */
const allJson = require('./data/all.json');
/**
 * @type {LeveInfoMap}
 */
const levelJson = require('./data/level.json');
/**
 * @type {SynthesisInfoMap}
 */
const synthesisJson = require('./data/synthesis.json');

const PossibilityCalculator = {
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

      if (Object.keys(possessSynthesisInfosMap).length < 1) {
        delete possessLevelSynthesisInfosMap[nextLevel];
      }
      levelIndex = nextLevel;
    }
    return possessLevelSynthesisInfosMap;
  },
  /**
   *
   * @param {string[]} materialNames
   * @param {Level} targetLevel
   * @returns {LevelCalculateSynthesisLinkInfos}
   */
  calculate({materialNames, targetLevel = '7'}) {
    targetLevel = SynthesisCalculator.verifyLevel(targetLevel);
    const computeLevel = SynthesisCalculator.verifyLevel(targetLevel - 1);
    const materialIds = SynthesisCalculator.namesToIds(materialNames);
    const synthesisInfoBackwardsMap = PossibilityCalculator.synthesisJsonToBackwards();
    const allRoutes = PossibilityCalculator.allRoute({
      materialIds, synthesisInfoBackwardsMap, maxLevel: computeLevel
    });

    const allSynthesisLinks = SynthesisCalculator.handleSynthesisLinks({
      targetLevel,
      levelSynthesisInfosMap: allRoutes,
      materialIds,
    });

    const targetLevelInfos = levelJson[targetLevel];
    const levelCalculateSynthesisLinkInfos = {};
    for (let i = 0; i < targetLevelInfos.length; i++) {
      const levelInfo = targetLevelInfos[i];
      const synthesisInfos = synthesisJson[levelInfo.id] || [];
      const calculateSynthesisLinkInfos = [];
      levelCalculateSynthesisLinkInfos[levelInfo.id] = calculateSynthesisLinkInfos;
      for (const synthesisInfo of synthesisInfos) {
        const res = SynthesisCalculator.calculateSynthesisLink({
          allSynthesisLinks,
          synthesisInfo,
          materialIds,
          allowLack: false,
        });
        if (!res || res.k < 2) {
          continue
        }
        calculateSynthesisLinkInfos.push(res);
      }
      SynthesisCalculator.prioritySort(calculateSynthesisLinkInfos);
    }
    return levelCalculateSynthesisLinkInfos;
  },
  /**
   *
   * @param {LevelCalculateSynthesisLinkInfos} levelCalculateSynthesisLinkInfos
   * @param {number} showMax
   * @returns {string}
   */
  format({levelCalculateSynthesisLinkInfos, showMax = 3}) {
    if (!levelCalculateSynthesisLinkInfos || Object.keys(levelCalculateSynthesisLinkInfos).length < 1) {
      return "no result\n";
    }
    if (showMax > 6) {
      showMax = 6;
    }
    let content = '';
    for (let id in levelCalculateSynthesisLinkInfos) {
      let calculateSynthesisLinkInfos = levelCalculateSynthesisLinkInfos[id];
      if (calculateSynthesisLinkInfos.length < 1) {
        continue;
      }
      content += ` 🌠 ${allJson[id]?.name}`;
      content += showMax === 1 ? ' ' : '\n';
      for (let i = 0; i < calculateSynthesisLinkInfos.length && i < showMax; i++) {
        const item = calculateSynthesisLinkInfos[i];
        content += ` 👪 `;
        content += SynthesisCalculator.formatSynthesisLink({
          synthesisLink: item,
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
