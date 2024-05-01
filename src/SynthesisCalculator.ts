/**
 @typedef {number} Level
 */
/**
 @typedef {string} Id
 */

/**
 * @typedef {Object} SynthesisInfo
 * @property {Id} CharacterDesignId1
 * @property {Id} CharacterDesignId2
 * @property {Id} ToCharacterDesignId
 */

/**
 * @typedef {Object.<Level, Id[]>} LevelIdsMap
 */

/**
 * @typedef {Object} CalculateInfo
 * @property {Id} id
 * @property {SynthesisInfo[]} synthesisList
 */

/**
 * @typedef {Object.<Level,CalculateInfo>} CalculateInfoMap
 */

/**
 * @typedef {Object} Route
 * @property {string} targetName
 * @property {number} routeDepth
 * @property {number} k
 * @property {Route[]} routes
 * @property {Id[]} depleteIds
 * @property {string[]} lackNames
 */

/**
 * @typedef {SynthesisInfo & Route} SynthesisRouteInfo
 */

/**
 * @typedef {Route} BeautifyRouteInfo
 * @property {string} name1
 * @property {string} name2
 * @property {string[]} depleteNames
 */


/**/
const allJson = require('./data/all.json');
const levelJson = require('./data/level.json');
/**
 *
 * @type {Object.<Id,SynthesisInfo[]>}
 */
const synthesisJson = require('./data/synthesis.json');

const SynthesisCalculator = {
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
    rms.forEach(item => {
      const pi = array.indexOf(item);
      if (pi > -1) {
        array.splice(pi, 1);
      }
    })
  },
  /**
   *
   * @param {Route[]} list
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
      return b.depleteIds.length - a.depleteIds.length;
    })
  },
  /**
   *
   * @param {CalculateInfoMap[]} possibilitySynthesisLinks
   * @param {SynthesisInfo} synthesisInfo
   * @param {Id[]} materialIds
   * @param {number} [nextIndex=1]
   * @returns {Route}
   */
  calculateSynthesisRoute({possibilitySynthesisLinks, synthesisInfo, materialIds, nextIndex = 1}) {
    const id1 = synthesisInfo['CharacterDesignId1'];
    const id2 = synthesisInfo['CharacterDesignId2'];
    let route1 = {
      targetName: allJson[id1]?.name,
      routeDepth: 0,
    };
    let route2 = {
      targetName: allJson[id2]?.name,
      routeDepth: 0,
    };
    let depleteIds = [];
    let exist1 = false;
    let exist2 = false;
    if (materialIds.includes(id1)) {
      materialIds.splice(materialIds.indexOf(id1), 1);
      depleteIds.push(id1);
      route1.k = 1;
      exist1 = true;
    }
    if (materialIds.includes(id2)) {
      materialIds.splice(materialIds.indexOf(id2), 1);
      depleteIds.push(id2);
      route2.k = 1;
      exist2 = true;
    }

    const allRoutes = [];
    const nextCalculateInfoMap = possibilitySynthesisLinks[nextIndex] || [];
    const synthesisList1 = nextCalculateInfoMap[id1]?.synthesisList || [false];
    const synthesisList2 = nextCalculateInfoMap[id2]?.synthesisList || [false];
    synthesisList1.forEach(item1 => {
      synthesisList2.forEach(item2 => {
        let r1 = {...route1};
        let r2 = {...route2};
        let lackNames = [];
        const mIds = [...materialIds];
        let dIds = [...depleteIds];
        let k = 0;
        if (exist1) {
          k++;
        } else if (item1) {
          const res = this.calculateSynthesisRoute({
            possibilitySynthesisLinks,
            synthesisInfo: item1,
            materialIds: mIds,
            nextIndex: nextIndex + 1
          });
          k += res.k / 2;
          this.arrayRm(mIds, res.depleteIds);
          dIds = [...dIds, ...res.depleteIds]
          r1 = {
            ...r1,
            k: res.k / 2,
            routes: res.routes,
            routeDepth: res.routeDepth + 1,
            lackNames: res.lackNames,
          };
        } else {
          lackNames.push(r1.targetName);
        }

        if (exist2) {
          k++;
        } else if (item2) {
          const res = this.calculateSynthesisRoute({
            possibilitySynthesisLinks,
            synthesisInfo: item2,
            materialIds: mIds,
            nextIndex: nextIndex + 1
          });
          k += res.k / 2;
          this.arrayRm(mIds, res.depleteIds);
          dIds = [...dIds, ...res.depleteIds]
          r2 = {
            ...r2,
            k: res.k / 2,
            routes: res.routes,
            routeDepth: res.routeDepth + 1,
            lackNames: res.lackNames,
          }
        } else {
          lackNames.push(r2.targetName);
        }

        allRoutes.push({
          k,
          routes: [r1, r2],
          routeDepth: Math.max(r1.routeDepth, r2.routeDepth),
          depleteIds: dIds,
          lackNames: [...lackNames, ...(r1.lackNames || []), ...(r2.lackNames || [])],
        })
      })
    });
    this.prioritySort(allRoutes);
    return allRoutes[0] || {
      k: 0, routes: [], routeDepth: 0, depleteIds: []
    }
  },
  /**
   *
   * @param {SynthesisInfo[]} targetSynthesisList
   * @returns {BeautifyRouteInfo[]}
   */
  beautifySynthesisRoutes(targetSynthesisList) {
    const beautify = JSON.parse(JSON.stringify(targetSynthesisList));
    beautify.forEach(item => {
      item.name1 = allJson[item['CharacterDesignId1']]?.name;
      item.name2 = allJson[item['CharacterDesignId2']]?.name;
      item.depleteNames = item.depleteIds.map(id => allJson[id]?.name);
      delete item['ToCharacterDesignId'];
      delete item['CharacterDesignId1'];
      delete item['CharacterDesignId2'];
    });
    return beautify;
  },
  /**
   *
   * @param {string} targetName
   * @param {string[]} materialNames
   * @param {Level} minimumLevel
   * @returns {null|SynthesisRouteInfo[]}
   */
  calculate({targetName, materialNames = [], minimumLevel = 3}) {
    const {levelIdsMap, targetId, materialIds} = this.handleLevelJson({targetName, materialNames})

    const targetSynthesisList = synthesisJson[targetId];
    if (!targetSynthesisList) {
      return null;
    }

    const allCalculateInfoMaps = this.calculateAll({targetId, targetSynthesisList, levelIdsMap, minimumLevel});
    const possibilitySynthesisLinks = this.calculatePossibility({materialIds, allCalculateInfoMaps})


    const targetSynthesisRoutes = [];
    for (let i = 0; i < targetSynthesisList.length; i++) {
      const synthesisInfo = targetSynthesisList[i];
      const res = this.calculateSynthesisRoute({
        possibilitySynthesisLinks,
        synthesisInfo,
        materialIds: [...materialIds]
      });
      targetSynthesisRoutes.push({
        ...synthesisInfo,
        ...res
      });
    }
    this.prioritySort(targetSynthesisRoutes);
    return targetSynthesisRoutes;
  },
  /**
   *
   * @param {?SynthesisRouteInfo[]} synthesisRoutes
   * @param {number} showMax
   * @returns {string}
   */
  format({synthesisRoutes = [], showMax = 5}) {
    if (!synthesisRoutes || synthesisRoutes.length < 1) {
      return "no result";
    }
    if (showMax > 30) {
      showMax = 30;
    }
    let contents = [];
    const beautifySynthesisRoutes = this.beautifySynthesisRoutes(synthesisRoutes);
    for (let i = 0; i < beautifySynthesisRoutes.length && i < showMax; i++) {
      const item = beautifySynthesisRoutes[i];
      contents.push(`${item.name1} x ${item.name2};  ${item.depleteNames.join(', ')};  ${item.lackNames.join(', ')}`)
    }
    return contents.join('\n');
  }
}

export default SynthesisCalculator;
