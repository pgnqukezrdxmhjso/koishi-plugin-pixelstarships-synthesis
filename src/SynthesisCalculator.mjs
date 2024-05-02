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
   * @param {Id} targetId
   * @param {SynthesisInfo[]} targetSynthesisList
   * @param {LevelIdsMap} levelIdsMap
   * @param {Level} minimumLevel
   * @returns {CalculateInfoMap[]}
   */
  calculateAll({targetId, targetSynthesisList, levelIdsMap, minimumLevel}) {
    const allCalculateInfoMaps = [{[targetId]: {id: targetId, synthesisList: targetSynthesisList}}];
    let index = 0;
    while (true) {
      const row = allCalculateInfoMaps[index++];
      let end = false;
      const nextIds = new Set();
      for (const id in row) {
        const item = row[id];
        if (levelIdsMap[minimumLevel]?.includes(item.synthesisList[0]['CharacterDesignId1'])) {
          end = true;
          break;
        }
        item.synthesisList.forEach(synthesisInfo => {
          nextIds.add(synthesisInfo['CharacterDesignId1']);
          nextIds.add(synthesisInfo['CharacterDesignId2']);
        })
      }
      if (end) {
        break;
      }
      const nextCalculateInfoMap = {};
      nextIds.forEach((id) => {
        const synthesisList = synthesisJson[id];
        if (!synthesisList) {
          return;
        }
        nextCalculateInfoMap[id] = {id, synthesisList};
      });
      if (JSON.stringify(nextCalculateInfoMap) === '{}') {
        break;
      }
      allCalculateInfoMaps.push(nextCalculateInfoMap);
    }
    return allCalculateInfoMaps;
  },
  /**
   *
   * @param {Id[]} materialIds
   * @param {CalculateInfoMap[]} allCalculateInfoMaps
   * @returns {CalculateInfoMap[]}
   */
  calculatePossibility({materialIds, allCalculateInfoMaps}) {
    const possibilitySynthesisLinks = [];
    if (materialIds.length > 1) {
      const newPossessIds = [...materialIds]
      for (let i = allCalculateInfoMaps.length - 1; i >= 0; i--) {
        const row = allCalculateInfoMaps[i];
        const newCalculateInfoMap = {};
        for (const id in row) {
          const item = row[id];
          const newSynthesisList = [];
          for (let synthesisInfo of item.synthesisList) {
            if (newPossessIds.includes(synthesisInfo['CharacterDesignId1']) || newPossessIds.includes(synthesisInfo['CharacterDesignId2'])) {
              newSynthesisList.push(synthesisInfo);
            }
          }
          if (newSynthesisList.length > 0) {
            newCalculateInfoMap[item.id] = {
              id: item.id,
              synthesisList: newSynthesisList,
            };
            newPossessIds.push(item.id);
          }
        }
        possibilitySynthesisLinks.unshift(newCalculateInfoMap);
      }
    }
    return possibilitySynthesisLinks;
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
   * @param {CalculateInfoMap[]} possibilitySynthesisLinks
   * @param {SynthesisInfo} synthesisInfo
   * @param {Id[]} materialIds
   * @param {number} [nextIndex=1]
   * @returns {SynthesisRouteInfo}
   */
  calculateSynthesisRoute({possibilitySynthesisLinks, synthesisInfo, materialIds, nextIndex = 1}) {
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

    const allRoutes = [];
    const nextCalculateInfoMap = possibilitySynthesisLinks[nextIndex] || {};
    const synthesisList1 = nextCalculateInfoMap[id1]?.synthesisList || [false];
    const synthesisList2 = nextCalculateInfoMap[id2]?.synthesisList || [false];
    synthesisList1.forEach(item1 => {
      synthesisList2.forEach(item2 => {
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
          const res = SynthesisCalculator.calculateSynthesisRoute({
            possibilitySynthesisLinks,
            synthesisInfo: item1,
            materialIds: mIds,
            nextIndex: nextIndex + 1
          });
          SynthesisCalculator.arrayRm(mIds, res.depleteIds);
          dIds.push(...res.depleteIds)
          r1 = res;
          r1.k = res.k / 2;
          r1.routeDepth = res.routeDepth + 1;
          if (r1.lackIds) {
            lackIds.push(...r1.lackIds);
          }

          k += r1.k;
        } else {
          lackIds.push(id1);
        }

        let r2;
        if (exist2) {
          k++;
          r2 = {
            k: 1,
            exist: true,
            routeDepth: 0
          }
        } else if (item2) {
          const res = SynthesisCalculator.calculateSynthesisRoute({
            possibilitySynthesisLinks,
            synthesisInfo: item2,
            materialIds: mIds,
            nextIndex: nextIndex + 1
          });
          SynthesisCalculator.arrayRm(mIds, res.depleteIds);
          dIds.push(...res.depleteIds)
          r2 = res;
          r2.k = res.k / 2;
          r2.routeDepth = res.routeDepth + 1;
          if (r2.lackIds) {
            lackIds.push(...r2.lackIds);
          }

          k += r2.k;
        } else {
          lackIds.push(id2);
        }

        allRoutes.push({
          k,
          routes: [r1, r2],
          routeDepth: Math.max(r1?.routeDepth, r2?.routeDepth),
          depleteIds: dIds,
          lackIds,
        })
      })
    });
    SynthesisCalculator.prioritySort(allRoutes);

    /**
     * @type {SynthesisRouteInfo}
     */
    let route = allRoutes[0];
    if (!route) {
      route = {
        k: 0, routeDepth: 0, routes: [], depleteIds: []
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
    const targetSynthesisList = synthesisJson[targetId];
    if (!targetSynthesisList) {
      return null;
    }

    const allCalculateInfoMaps = SynthesisCalculator.calculateAll({
      targetId,
      targetSynthesisList,
      levelIdsMap,
      minimumLevel
    });
    const possibilitySynthesisLinks = SynthesisCalculator.calculatePossibility({materialIds, allCalculateInfoMaps})

    const taskList = targetSynthesisList.map(synthesisInfo => SynthesisCalculator.getTinypool().run({
      possibilitySynthesisLinks,
      synthesisInfo,
      materialIds: [...materialIds]
    }, {name: 'calculateSynthesisRoute'}));
    const targetSynthesisRoutes = await Promise.all(taskList);
    // const targetSynthesisRoutes = targetSynthesisList.map(synthesisInfo =>
    //   SynthesisCalculator.calculateSynthesisRoute({
    //     possibilitySynthesisLinks,
    //     synthesisInfo,
    //     materialIds: [...materialIds]
    //   })
    // )
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
  /**
   *
   * @param {SynthesisRouteInfo} synthesisRouteInfo
   * @param {Level} level
   */
  formatSynthesisRouteInfo({synthesisRouteInfo, level}) {
    const nextLevel = SynthesisCalculator.verifyLevel(level) - 1;
    let beautifyInfo = SynthesisCalculator.beautifySynthesisRouteInfo(synthesisRouteInfo);
    let routes = synthesisRouteInfo.routes || [];
    let content = "";
    content += beautifyInfo.name1;
    if (routes[0] && !routes[0].exist) {
      content += `(${nextLevel}`;
      content += SynthesisCalculator.formatSynthesisRouteInfo({synthesisRouteInfo: routes[0], level: nextLevel});
      content += `${nextLevel})`;
    }
    content += ' x '
    content += beautifyInfo.name2;
    if (routes[1] && !routes[1].exist) {
      content += `(${nextLevel}`;
      content += SynthesisCalculator.formatSynthesisRouteInfo({synthesisRouteInfo: routes[1], level: nextLevel});
      content += `${nextLevel})`;
    }

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
      content += 'route: ';
      content += SynthesisCalculator.formatSynthesisRouteInfo({
        synthesisRouteInfo,
        level
      })
      content += `;`;
      if (beautifySynthesisRouteInfo.lackNames && beautifySynthesisRouteInfo.lackNames.length > 0) {
        content += ` lack: ${beautifySynthesisRouteInfo.lackNames.join(', ')}`
      }
      content += `\n`;
    }

    return content;
  }
}

export default SynthesisCalculator;
export const calculateSynthesisRoute = SynthesisCalculator.calculateSynthesisRoute
