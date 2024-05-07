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
  levelIdsMap: null,
  /**
   *
   * @return {LevelIdsMap}
   */
  getLevelIdsMap() {
    if (SynthesisCalculator.levelIdsMap) {
      return SynthesisCalculator.levelIdsMap;
    }
    const levelIdsMap = {}
    for (let level in levelJson) {
      levelIdsMap[level] = []
      for (const item of levelJson[level]) {
        levelIdsMap[level].push(item.id);
      }
    }
    SynthesisCalculator.levelIdsMap = levelIdsMap;
    return levelIdsMap
  },
  /**
   *
   * @param {Id} id
   * @return {Level}
   */
  getIdLevel(id) {
    let levelIdsMap = SynthesisCalculator.getLevelIdsMap();
    let level;
    for (let l in levelIdsMap) {
      if (levelIdsMap[l].includes(id)) {
        level = l;
        break;
      }
    }
    return level;
  },
  nameMap: null,
  getNameMap() {
    if (!SynthesisCalculator.nameMap) {
      const nameMap = {};
      for (let id in allJson) {
        nameMap[allJson[id].name] = allJson[id];
      }
      SynthesisCalculator.nameMap = nameMap;
    }
    return SynthesisCalculator.nameMap;
  },
  /**
   *
   * @param {string[]} names
   * @returns {Id[]}
   */
  namesToIds(names) {
    const nameMap = SynthesisCalculator.getNameMap();
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
   * @param {string[]} names
   * @return {*[]|null}
   */
  verifyNames(names) {
    const nameMap = SynthesisCalculator.getNameMap();
    const errorNames = []
    names.forEach(name => {
      if (!nameMap[name]) {
        errorNames.push(name);
      }
    });
    return errorNames;
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
    for (let level = targetLevel; SynthesisCalculator.verifyLevel(level - 1) > minimumLevel; level = nextLevel) {
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
   * @returns {LevelSynthesisInfosMap}
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
   * @param {SynthesisRouteInfo} a
   * @param {SynthesisRouteInfo} b
   * @return {number}
   */
  prioritySortFn(a, b) {
    let diff = b.k - a.k;
    if (diff !== 0) {
      return diff;
    }
    diff = a.depth - b.depth;
    if (diff !== 0) {
      return diff;
    }
    diff = (a.lackIds?.length || 0) - (b.lackIds?.length || 0);
    if (diff !== 0) {
      return diff;
    }
    return a.depleteIds.length - b.depleteIds.length;
  },
  /**
   *
   * @param {SynthesisRouteInfo[]} list
   */
  prioritySort(list) {
    list.sort(SynthesisCalculator.prioritySortFn)
  },
  /**
   *
   * @param {Level} targetLevel
   * @param {LevelSynthesisInfosMap} levelSynthesisInfosMap
   * @param {Id[]} materialIds
   * @param {boolean} allowLack
   * @return {IdSynthesisLinksMap}
   */
  handleSynthesisLinks({targetLevel, levelSynthesisInfosMap, materialIds, allowLack = true}) {
    /**
     * @type {IdSynthesisLinksMap}
     */
    const allSynthesisLinks = {};
    const getOrDefaultLink = ({id, level}) => {
      if (!allSynthesisLinks[id]) {
        allSynthesisLinks[id] = [{
          tId: id,
          level,
          k: materialIds.includes(id) ? 1 : 0,
          depth: 0,
          materials: [id],
        }]
      }
      return allSynthesisLinks[id];
    }
    for (let l = 4; l <= 5 && l < targetLevel; l++) {
      const level = l + '';
      const nextLevel = SynthesisCalculator.verifyLevel(level - 1);
      for (let id in levelSynthesisInfosMap[level]) {
        const synthesisLinks = getOrDefaultLink({id, level});
        levelSynthesisInfosMap[level][id]?.forEach(synthesisInfo => {
          const id1 = synthesisInfo.CharacterDesignId1;
          const id2 = synthesisInfo.CharacterDesignId2;
          getOrDefaultLink({id: id1, level: nextLevel}).forEach((synthesisLink1) => {
            getOrDefaultLink({id: id2, level: nextLevel}).forEach((synthesisLink2) => {
              const materials = [...synthesisLink1.materials, ...synthesisLink2.materials];
              const mIds = [...materialIds];
              const depleteIds = [];

              const k = materials.reduce((k, mId) => {
                if (!mIds.includes(mId)) {
                  return k;
                }
                depleteIds.push(mId);
                mIds.splice(mIds.indexOf(mId), 1);
                return k + 1;
              }, 0) / materials.length;

              if (k <= 0 || !allowLack && k < 1) {
                return;
              }

              const lackIds = [];
              materials.forEach(id => {
                if (!materialIds.includes(id)) {
                  lackIds.push(id);
                }
              })
              synthesisLinks.push({
                tId: id,
                level,
                k,
                depleteIds,
                lackIds,
                depth: 1 + (synthesisLink1.depth / 2) + (synthesisLink2.depth / 2),
                synthesisLink1,
                synthesisLink2,
                materials
              });
            });
          });
        });
        SynthesisCalculator.prioritySort(synthesisLinks);
      }
    }
    if (targetLevel === '4') {
      for (let id of materialIds) {
        if (SynthesisCalculator.getIdLevel(id) !== '3') {
          continue;
        }
        getOrDefaultLink({id, level: targetLevel});
      }
    }
    for (let id in levelSynthesisInfosMap[targetLevel]) {
      const level = SynthesisCalculator.verifyLevel(targetLevel - 1);
      levelSynthesisInfosMap[targetLevel][id]?.forEach(synthesisInfo => {
        getOrDefaultLink({id: synthesisInfo.CharacterDesignId1, level});
        getOrDefaultLink({id: synthesisInfo.CharacterDesignId2, level});
      })
    }
    for (let id in allSynthesisLinks) {
      const synthesisLinks = allSynthesisLinks[id];
      if ((synthesisLinks?.length || 0) < 50) {
        continue;
      }
      allSynthesisLinks[id] = allSynthesisLinks[id].slice(0, 50)
    }
    return allSynthesisLinks
  },
  /**
   *
   * @param {IdSynthesisLinksMap} allSynthesisLinks
   * @param {Id[]} materialIds
   * @param {SynthesisInfo} synthesisInfo
   * @param {boolean} allowLack
   * @returns {CalculateSynthesisLinkInfo}
   */
  calculateSynthesisLink({
                           allSynthesisLinks,
                           materialIds,
                           synthesisInfo,
                           allowLack = true,
                         }) {

    const id1 = synthesisInfo.CharacterDesignId1;
    const id2 = synthesisInfo.CharacterDesignId2;
    /**
     * @type {CalculateSynthesisLinkInfo}
     */
    const calculateInfo = {
      k: -1,
      depth: 0
    }

    for (const synthesisLink1 of allSynthesisLinks[id1] || []) {
      let end = false;
      for (const synthesisLink2 of allSynthesisLinks[id2] || []) {
        const mIds = [...materialIds];
        const depleteIds = [];

        const _reduce = (k, mId) => {
          if (!mIds.includes(mId)) {
            return k;
          }
          depleteIds.push(mId);
          mIds.splice(mIds.indexOf(mId), 1);
          return k + 1;
        }

        let k = synthesisLink1.materials.reduce(_reduce, 0) / synthesisLink1.materials.length;
        k += synthesisLink2.materials.reduce(_reduce, 0) / synthesisLink2.materials.length;
        let depth = (synthesisLink1.depth / 2) + (synthesisLink2.depth / 2);


        if ((!allowLack && k === 2) || SynthesisCalculator.prioritySortFn(calculateInfo, {k, depth, depleteIds}) > 0) {
          calculateInfo.k = k;
          calculateInfo.depth = depth;
          calculateInfo.depleteIds = depleteIds;
          calculateInfo.synthesisLink1 = synthesisLink1;
          calculateInfo.synthesisLink2 = synthesisLink2;
          if (k >= 2) {
            end = true;
            break;
          }
        }
      }
      if (end) {
        break;
      }
    }

    if (calculateInfo.k === -1) {
      return calculateInfo;
    }

    if (calculateInfo.k < 2) {
      calculateInfo.lackIds = [];
      calculateInfo.synthesisLink1.materials.forEach(id => {
        if (!materialIds.includes(id)) {
          calculateInfo.lackIds.push(id);
        }
      })
      calculateInfo.synthesisLink2.materials.forEach(id => {
        if (!materialIds.includes(id)) {
          calculateInfo.lackIds.push(id);
        }
      })
    }
    return calculateInfo;
  },
  /**
   *
   * @param {string} targetName
   * @param {string[]} materialNames
   * @param {Level} minimumLevel
   * @returns {Promise<null|CalculateSynthesisLinkInfo[]>}
   */
  _calculate({targetName, materialNames, minimumLevel}) {
    return SynthesisCalculator.getTinypool().run({
      targetName,
      materialNames,
      minimumLevel,
    }, {name: 'calculate'});
  },
  /**
   *
   * @param {string} targetName
   * @param {string[]} materialNames
   * @param {Level} minimumLevel
   * @returns {null|CalculateSynthesisLinkInfo[]}
   */
  calculate({targetName, materialNames = [], minimumLevel = '3'}) {
    const materialIds = SynthesisCalculator.namesToIds(materialNames);
    if (materialIds.length < 2) {
      return null;
    }
    const [targetId] = SynthesisCalculator.namesToIds([targetName]);

    let targetLevel = SynthesisCalculator.getIdLevel(targetId)
    if (targetLevel === '6') {
      return null;
    }

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

    const allSynthesisLinks = SynthesisCalculator.handleSynthesisLinks({
      targetLevel,
      levelSynthesisInfosMap: possibilityLevelSynthesisInfosMap,
      materialIds,
    });

    const calculateSynthesisLinkInfos = possibilityLevelSynthesisInfosMap[targetLevel][targetId].map(synthesisInfo =>
      SynthesisCalculator.calculateSynthesisLink({
        allSynthesisLinks,
        materialIds,
        synthesisInfo,
      })
    );
    SynthesisCalculator.prioritySort(calculateSynthesisLinkInfos);
    return calculateSynthesisLinkInfos;
  },
  /**
   *
   * @param {Level|number} level
   * @return {Level}
   */
  verifyLevel(level) {
    if (level > 7) {
      level = '7';
    } else if (level + '' === '6') {
      level = '5';
    }
    return level + '';
  },
  /**
   *
   * @param {SynthesisLink} synthesisLink
   * @return {String}
   */
  formatSynthesisLink2({synthesisLink}) {
    let content = allJson[synthesisLink.tId]?.name;
    if (synthesisLink.materials.length < 2) {
      return content;
    }
    content += `(${synthesisLink.level - 1}`
    content += SynthesisCalculator.formatSynthesisLink({synthesisLink});
    content += `${synthesisLink.level - 1})`
    return content;
  },
  /**
   *
   * @param {SynthesisLink|CalculateSynthesisLinkInfo} synthesisLink
   * @return {String}
   */
  formatSynthesisLink({synthesisLink}) {
    let synthesisLink1;
    let synthesisLink2;
    if ((synthesisLink.synthesisLink1?.depth || 0) < (synthesisLink.synthesisLink2?.depth || 0)) {
      synthesisLink1 = synthesisLink.synthesisLink1;
      synthesisLink2 = synthesisLink.synthesisLink2;
    } else {
      synthesisLink1 = synthesisLink.synthesisLink2;
      synthesisLink2 = synthesisLink.synthesisLink1;
    }
    let content = "";
    content += SynthesisCalculator.formatSynthesisLink2({synthesisLink: synthesisLink1});
    content += '✨'
    content += SynthesisCalculator.formatSynthesisLink2({synthesisLink: synthesisLink2});
    return content;
  },
  /**
   *
   * @param {CalculateSynthesisLinkInfo[]} calculateSynthesisLinkInfos
   * @param {number} showMax
   * @returns {string}
   */
  format({calculateSynthesisLinkInfos, showMax = 10}) {
    if (!calculateSynthesisLinkInfos || calculateSynthesisLinkInfos.length < 1) {
      return "no result\n";
    }
    if (showMax > 30) {
      showMax = 30;
    }

    let content = '';
    for (let i = 0; i < calculateSynthesisLinkInfos.length && i < showMax; i++) {
      const info = calculateSynthesisLinkInfos[i];
      content += ' 👪 ';
      content += SynthesisCalculator.formatSynthesisLink({
        synthesisLink: info,
      })
      if (info.lackIds?.length > 0) {
        content += `😡 ${info.lackIds.map(id => allJson[id]?.name).join(', ')}`
      }
      content += `\n`;
    }
    return content;

  },
}

export default SynthesisCalculator;
export const calculate = SynthesisCalculator.calculate
