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
 * @property {RoleInfoMsg} msg
 * @property {Object} bigImg
 */
/**
 * @typedef {Object} RoleInfoMsg
 * @property {String} GenderType
 * @property {String} Hp
 * @property {String} FinalHp
 * @property {String} Attack
 * @property {String} FinalAttack
 * @property {String} Weapon
 * @property {String} FinalWeapon
 * @property {String} Science
 * @property {String} FinalScience
 * @property {String} Engine
 * @property {String} FinalEngine
 * @property {String} WalkingSpeed
 * @property {String} RunSpeed
 * @property {String} FireResistance
 * @property {String} Research
 * @property {String} FinalResearch
 * @property {String} Repair
 * @property {String} FinalRepair
 * @property {String} Pilot
 * @property {String} FinalPilot
 * @property {String} SpecialAbilityArgument
 * @property {String} SpecialAbilityFinalArgument
 * @property {String} SpecialAbilityType
 * @property {String} TrainingCapacity
 * @property {String} EquipmentMask
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
 * @typedef {CalculateInfo[]} CalculateInfos
 */

/**
 * @typedef {Object} CalculateInfo
 * @property {Id} tId
 * @property {Level} level
 * @property {CalculateSynthesisLinkInfo[]} synthesisLinkInfos
 */

/**
 * @typedef {Object.<Id,number>} DepleteIdTotal
 */

/**
 * @typedef {Object} CalculateSynthesisLinkInfo
 * @property {SynthesisLink} [synthesisLink1]
 * @property {SynthesisLink} [synthesisLink2]
 * @property {number} k
 * @property {number} depth
 * @property {Id[]} [depleteIds]
 * @property {DepleteIdTotal} [depleteIdTotal]
 * @property {Id[]} [lackIds]
 */

/**
 * @typedef {Object.<Id,number>} MaterialIdMap
 */
