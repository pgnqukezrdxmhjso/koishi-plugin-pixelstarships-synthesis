/**
 * @typedef {string} Level
 */
/**
 * @typedef {string} Id
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
 * @typedef {Object.<Id, RoleInfo>} RoleInfoMap
 */


/**
 * level.json
 * @typedef {Object} LeveInfo
 * @property {Id} id
 * @property {string} name
 * @property {Level} Rarity
 */
/**
 * @typedef {Object.<Id, LeveInfo[]>} LeveInfoMap
 */

/**
 * synthesis.json
 * @typedef {Object} SynthesisInfo
 * @property {Id} CharacterDesignId1
 * @property {Id} CharacterDesignId2
 * @property {Id} ToCharacterDesignId
 */
/**
 * @typedef {Object.<Id, SynthesisInfo[]>} SynthesisInfoMap
 */


/**
 * @typedef {Object.<Level, Id[]>} LevelIdsMap
 */


/**
 * @typedef {Object} SynthesisRouteInfo
 * @property {boolean} [exist]
 * @property {number} k
 * @property {SynthesisRouteInfo[]} [routes]
 * @property {number} depth
 * @property {Id[]} [depleteIds]
 * @property {Id[]} [lackIds]
 * @property {SynthesisInfo} [synthesisInfo]
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
 * @typedef {Object.<Id, Object.<Id, SynthesisInfo>>} SynthesisInfoBackwardsMap
 */

/**
 * @typedef {Object.<Level, Object.<Id, SynthesisInfo[]>>} LevelSynthesisInfosMap
 */

/**
 * @typedef {Object.<Level, Object.<Id, CalculateSynthesisLinkInfo[]>>} LevelCalculateSynthesisLinkInfosMap
 */

/**
 * @typedef {Object} SynthesisLink
 * @property {Id} tId
 * @property {Level} level
 * @property {number} k
 * @property {Id[]} [depleteIds]
 * @property {Id[]} [lackIds]
 * @property {Id[]} materials
 * @property {number} depth
 * @property {SynthesisLink} [synthesisLink1]
 * @property {SynthesisLink} [synthesisLink2]
 */


/**
 * @typedef {Object.<Id,SynthesisLink[]>} IdSynthesisLinksMap
 */

/**
 * @typedef {Object} CalculateSynthesisLinkInfo
 * @property {SynthesisLink} [synthesisLink1]
 * @property {SynthesisLink} [synthesisLink2]
 * @property {number} k
 * @property {number} depth
 * @property {Id[]} [depleteIds]
 * @property {Id[]} [lackIds]
 */
