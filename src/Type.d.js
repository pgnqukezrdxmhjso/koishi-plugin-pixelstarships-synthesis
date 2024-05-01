/**
 @typedef {number} Level
 */
/**
 @typedef {string} Id
 */

/**
 * all.json
 * @typedef {Object} RoleInfo
 * @property {Id} id
 * @property {string} name
 * @property {Object} img
 * @property {Object} msg
 * @property {Object} bigImg
 */
/**
 * @typedef {Object.<Id,RoleInfo>} RoleInfoMap
 */


/**
 * level.json
 * @typedef {Object} LeveInfo
 * @property {Id} id
 * @property {string} name
 * @property {Level} Rarity
 */
/**
 @typedef {Object.<Id,LeveInfo[]>} LeveInfoMap
 */

/**
 * synthesis.json
 * @typedef {Object} SynthesisInfo
 * @property {Id} CharacterDesignId1
 * @property {Id} CharacterDesignId2
 * @property {Id} ToCharacterDesignId
 */
/**
 @typedef {Object.<Id,SynthesisInfo[]>} SynthesisInfoMap
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
 * @typedef {Object} SynthesisRouteInfo
 * @property {boolean} [exist]
 * @property {number} k
 * @property {SynthesisRouteInfo[]} [routes]
 * @property {number} routeDepth
 * @property {Id[]} [depleteIds]
 * @property {Id[]} [lackIds]
 * @property {Id} [CharacterDesignId1]
 * @property {Id} [CharacterDesignId2]
 * @property {Id} [ToCharacterDesignId]
 */

/**
 * @typedef {SynthesisRouteInfo} BeautifySynthesisRouteInfo
 * @property {string} targetName
 * @property {string} name1
 * @property {string} name2
 * @property {string[]} depleteNames
 * @property {string[]} lackNames
 */

/**
 @typedef {Object.<Id,Object.<Id,Id>>} SynthesisInfoBackwardsMap
 */

/**
 @typedef {Object<Level, Object<Id, SynthesisInfo[]>>} AllLevelSynthesisRoutes
 */

/**
 @typedef {Object<Id, SynthesisRouteInfo[]>} LevelSynthesisRouteInfos
 */

