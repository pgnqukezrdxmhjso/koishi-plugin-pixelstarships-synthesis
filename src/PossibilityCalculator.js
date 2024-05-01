/**/
const allJson = require('./data/all.json');
/**
 * @type {LeveInfoMap}
 */
const levelJson = require('./data/level.json');
/**
 * @type {SynthesisInfoMap}
 */
const synthesisJson = require('./data/synthesis.json');
const SynthesisCalculator = require("./SynthesisCalculator");

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
    return names.map(name => nameMap[name].id);
  },
  /**
   *
   * @returns {SynthesisInfoBackwardsMap}
   */
  synthesisJsonToBackwards() {
    const synthesisMap = {};
    for (let id in synthesisJson) {
      synthesisJson[id].forEach((item) => {
        const id1 = item.CharacterDesignId1;
        const id2 = item.CharacterDesignId2;
        const toId = item.ToCharacterDesignId;
        if (!synthesisMap[id1]) {
          synthesisMap[id1] = {};
        }
        if (!synthesisMap[id2]) {
          synthesisMap[id2] = {};
        }
        synthesisMap[id1][id2] = toId;
        synthesisMap[id2][id1] = toId;
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
    levelInfos.forEach(item => {
      if (materialIds.includes(item.id)) {
        possessLeveInfoMap[item.id] = item;
      }
    });
    return possessLeveInfoMap;
  },
  /**
   *
   * @param {Id[]} materialIds
   * @param {SynthesisInfoBackwardsMap} synthesisInfoBackwardsMap
   * @param {Level} maxLevel
   * @returns {AllLevelSynthesisRoutes}
   */
  allRoute({materialIds, synthesisInfoBackwardsMap, maxLevel}) {
    /**
     * @type {Id[]}
     */
    materialIds = [...materialIds]
    /**
     * @type {Object.<Level,Object.<Id,SynthesisInfo[]>>}
     */
    const possessLevelSynthesisInfoMap = {};

    let levelIndex = 1;
    while (levelIndex < maxLevel) {
      let nextLevel = levelIndex;
      ++nextLevel === 6 && nextLevel++;

      const possessLeveInfoMap = this.filterPossessLeveInfoMap({
        materialIds,
        level: levelIndex
      });
      possessLevelSynthesisInfoMap[nextLevel] = {};
      const possessSynthesisInfo = possessLevelSynthesisInfoMap[nextLevel];
      /**
       * @type {Set<Id>}
       */
      const nextLevelIdSet = new Set();
      for (let id in possessLeveInfoMap) {
        let synthesisInfoMap = synthesisInfoBackwardsMap[id];
        for (let sId in synthesisInfoMap) {
          if (!possessLeveInfoMap[sId]) {
            continue;
          }
          const tId = synthesisInfoMap[sId];
          nextLevelIdSet.add(synthesisInfoMap[sId]);
          if (!possessSynthesisInfo[tId]) {
            possessSynthesisInfo[tId] = [];
          }
          possessSynthesisInfo[tId].push({
            CharacterDesignId1: id,
            CharacterDesignId2: sId,
            ToCharacterDesignId: tId,
          })
        }
      }
      for (let id of nextLevelIdSet.values()) {
        materialIds.push(id);
      }
      levelIndex = nextLevel;
    }
    return possessLevelSynthesisInfoMap;
  },
  /**
   *
   * @param {AllLevelSynthesisRoutes} allRoutes
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
          const res = this.calculateSynthesisRoute({
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
          const res = this.calculateSynthesisRoute({
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
    if (!route || route.k < 2) {
      route = {
        k: 0, routeDepth: 0, depleteIds: []
      };
    }

    route.CharacterDesignId1 = synthesisInfo.CharacterDesignId1;
    route.CharacterDesignId2 = synthesisInfo.CharacterDesignId2;
    route.ToCharacterDesignId = synthesisInfo.ToCharacterDesignId;

    return route;
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
   * @param {string[]} materialNames
   * @param {Level} targetLevel
   * @returns {LevelSynthesisRouteInfos}
   */
  calculate({materialNames, targetLevel = 7}) {
    targetLevel = this.verifyLevel(targetLevel);
    const computeLevel = targetLevel === 7 ? 5 : targetLevel - 1;
    const materialIds = this.namesToIds(materialNames);
    const synthesisInfoBackwardsMap = this.synthesisJsonToBackwards();
    const allRoutes = this.allRoute({
      materialIds, synthesisInfoBackwardsMap, maxLevel: computeLevel
    });

    const targetLevelInfos = levelJson[targetLevel];
    const targetLevelSynthesisRouteInfos = {};
    for (let i = 0; i < targetLevelInfos.length; i++) {
      const levelInfo = targetLevelInfos[i];
      const synthesisInfos = synthesisJson[levelInfo.id] || [];
      const synthesisRoutes = [];
      synthesisInfos.forEach(synthesisInfo => {
        const res = this.calculateSynthesisRoute({
          allRoutes,
          synthesisInfo,
          materialIds: [...materialIds],
          nextLevel: computeLevel
        });
        if (res.k < 2) {
          return;
        }
        synthesisRoutes.push(res);
      });
      SynthesisCalculator.prioritySort(synthesisRoutes);
      targetLevelSynthesisRouteInfos[levelInfo.id] = synthesisRoutes;
    }
    return targetLevelSynthesisRouteInfos;
  },
  /**
   *
   * @param {SynthesisRouteInfo} synthesisRouteInfo
   * @param {Level} level
   */
  formatSynthesisRouteInfo({synthesisRouteInfo, level}) {
    const nextLevel = this.verifyLevel(level) - 1;
    let beautifyInfo = SynthesisCalculator.beautifySynthesisRouteInfo(synthesisRouteInfo);
    let routes = synthesisRouteInfo.routes || [];
    let content = "";
    content += beautifyInfo.name1;
    if (routes[0] && !routes[0].exist) {
      content += `(${nextLevel}`;
      content += this.formatSynthesisRouteInfo({synthesisRouteInfo: routes[0], level: nextLevel});
      content += `${nextLevel})`;
    }
    content += ' x '
    content += beautifyInfo.name2;
    if (routes[1] && !routes[1].exist) {
      content += `(${nextLevel}`;
      content += this.formatSynthesisRouteInfo({synthesisRouteInfo: routes[1], level: nextLevel});
      content += `${nextLevel})`;
    }

    return content;
  },
  /**
   *
   * @param {LevelSynthesisRouteInfos} levelSynthesisRouteInfos
   * @param {number} showMax
   * @param {Level} level
   * @returns {string}
   */
  format({levelSynthesisRouteInfos, showMax = 3, level = 7}) {
    level = this.verifyLevel(level);
    if (!levelSynthesisRouteInfos || levelSynthesisRouteInfos.length < 1) {
      return "no result";
    }
    if (showMax > 6) {
      showMax = 6;
    }
    let content = "";
    for (let id in levelSynthesisRouteInfos) {
      let synthesisRouteInfos = levelSynthesisRouteInfos[id];
      if (synthesisRouteInfos.length < 1) {
        continue;
      }
      content += `target: ${allJson[id]?.name};\n`
      for (let i = 0; i < synthesisRouteInfos.length && i < showMax; i++) {
        const item = synthesisRouteInfos[i];
        content += `    route: ${this.formatSynthesisRouteInfo({synthesisRouteInfo: item, level: level - 1})};\n`;
      }
    }
    if (content.trim().length < 1) {
      return "no result";
    }
    return content;
  }
}

module.exports = PossibilityCalculator;
