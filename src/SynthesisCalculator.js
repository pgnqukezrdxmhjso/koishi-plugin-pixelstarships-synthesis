const fs = require("node:fs/promises");
const path = require("node:path");
const {XMLParser} = require("fast-xml-parser");
const Big = require('big.js');
const Strings = require("./utils/Strings");

const basePath = path.join(path.parse(__filename).dir, "../");
const allJsonPath = path.join(basePath, "./data/all.json");
const levelJsonPath = path.join(basePath, "./data/level.json");
const synthesisJsonPath = path.join(basePath, "./data/synthesis.json");
/**
 * @type {RoleInfoMap}
 */
let allJson = require(allJsonPath);
/**
 * @type {LeveInfoMap}
 */
let levelJson = require(levelJsonPath);
/**
 * @type {SynthesisInfoMap}
 */
let synthesisJson = require(synthesisJsonPath);


const SynthesisCalculator = {
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
  nameRMap: null,
  /**
   *
   * @return {Object.<string, RoleInfo>}
   */
  getNameMap() {
    if (!SynthesisCalculator.nameMap) {
      const nameMap = {};
      const nameRMap = {};
      for (let id in allJson) {
        const name = allJson[id].name;
        nameMap[name] = allJson[id];
        const rName = name.replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '-');
        if (rName !== name) {
          nameRMap[name] = rName;
        }
      }
      SynthesisCalculator.nameMap = nameMap;
      SynthesisCalculator.nameRMap = nameRMap;
    }
    return SynthesisCalculator.nameMap;
  },
  /**
   *
   * @param {string} names
   * @returns {Id[]}
   */
  namesToIds(names) {
    if (Strings.isEmpty(names)) {
      return [];
    }
    const nameMap = SynthesisCalculator.getNameMap();
    const nameRMap = SynthesisCalculator.nameRMap;
    for (let name in nameRMap) {
      names = names.replace(name, nameRMap[name]);
    }

    const nameList = names.split(/\s*[\s，。；,.;|]\s*/g);
    const errors = [];
    const ids = [];
    for (const name of nameList) {
      let id = nameMap[name]?.id;
      if (id) {
        ids.push(id);
        continue;
      }
      let ck = 999999;
      let cName;
      for (let rName in nameRMap) {
        const reg = nameRMap[rName];
        const k = Strings.levenshteinDistance(name, reg);
        if (k < ck && k < Math.max(name.length, reg.length)) {
          ck = k;
          cName = rName;
        }
      }
      for (let n in nameMap) {
        const k = Strings.levenshteinDistance(name, n);
        if (k < ck && k < Math.max(name.length, n.length)) {
          ck = k;
          cName = n;
        }
      }
      if (cName) {
        id = nameMap[cName]?.id;
        if (id) {
          ids.push(id);
          continue;
        }
      }

      errors.push(name);
    }
    if (errors.length > 0) {
      throw {
        msg: 'wrong name: ' + errors.join(', '),
        data: errors
      };
    }
    return ids;
  },
  /**
   *
   * @param {Id[]} materialIds
   * @param {boolean} allowLack
   * @returns {LevelSynthesisInfosMap}
   */
  calculatePossibility({materialIds, allowLack = true}) {
    const levels = Object.keys(levelJson);
    levels.sort((a, b) => a - b);

    const newLevelSynthesisInfosMap = {};
    const newPossessIds = [...materialIds];
    levels.forEach(level => {
      const levelInfos = levelJson[level];
      const newSynthesisInfosMap = {};
      for (let levelInfo of levelInfos) {
        const synthesisInfos = synthesisJson[levelInfo.id];
        if (!synthesisInfos) {
          continue;
        }
        const newSynthesisInfos = [];
        for (const synthesisInfo of synthesisInfos) {
          if (allowLack) {
            if (newPossessIds.includes(synthesisInfo.CharacterDesignId1) || newPossessIds.includes(synthesisInfo.CharacterDesignId2)) {
              newSynthesisInfos.push(synthesisInfo);
            }
          } else {
            if (newPossessIds.includes(synthesisInfo.CharacterDesignId1) && newPossessIds.includes(synthesisInfo.CharacterDesignId2)) {
              newSynthesisInfos.push(synthesisInfo);
            }
          }
        }
        if (newSynthesisInfos.length > 0) {
          newSynthesisInfosMap[levelInfo.id] = newSynthesisInfos;
          newPossessIds.push(levelInfo.id);
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
   * @param {LevelSynthesisInfosMap} levelSynthesisInfosMap
   * @param {Id[]} materialIds
   * @param {boolean} allowLack
   * @return {IdSynthesisLinksMap}
   */
  handleSynthesisLinks({levelSynthesisInfosMap, materialIds, allowLack = true}) {
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
    for (let l = 4; l <= 5; l++) {
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
    for (let id of materialIds) {
      getOrDefaultLink({id, level: SynthesisCalculator.getIdLevel(id)});
    }

    for (let id in allSynthesisLinks) {
      const synthesisLinks = allSynthesisLinks[id];
      if ((synthesisLinks?.length || 0) < 30) {
        continue;
      }
      allSynthesisLinks[id] = allSynthesisLinks[id].slice(0, 30);
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
      const mIds = [...materialIds];
      calculateInfo.lackIds = [];
      ([calculateInfo.synthesisLink1, calculateInfo.synthesisLink2]).forEach(synthesisLink =>
        synthesisLink.materials.forEach(id => {
          if (!mIds.includes(id)) {
            calculateInfo.lackIds.push(id);
          } else {
            mIds.splice(mIds.indexOf(id), 1);
          }
        })
      )
    }
    return calculateInfo;
  },
  /**
   *
   * @param {Level} targetLevel
   * @param {string} targetNames
   * @param {string} materialNames
   * @param {boolean} allowLack
   * @returns {null|LevelCalculateSynthesisLinkInfosMap}
   */
  calculate({targetLevel = '7', targetNames, materialNames, allowLack = true}) {
    targetLevel = SynthesisCalculator.verifyLevel(targetLevel);
    let targetIds;
    if (targetNames?.length > 0) {
      targetIds = SynthesisCalculator.namesToIds(targetNames);
    } else {
      targetIds = levelJson[targetLevel]?.map(levelInfo => levelInfo.id);
    }
    if (!targetIds || targetIds.length < 1) {
      return null;
    }

    const materialIds = SynthesisCalculator.namesToIds(materialNames);
    if (materialIds.length < 2) {
      return null;
    }

    const possibilityLevelSynthesisInfosMap = SynthesisCalculator.calculatePossibility({
      materialIds,
      allowLack,
    });

    const allSynthesisLinks = SynthesisCalculator.handleSynthesisLinks({
      levelSynthesisInfosMap: possibilityLevelSynthesisInfosMap,
      materialIds,
      allowLack,
    });

    const levelCalculateSynthesisLinkInfos = {};
    for (let targetId of targetIds) {
      const level = SynthesisCalculator.getIdLevel(targetId);
      const calculateSynthesisLinkInfos = [];
      (allowLack ? possibilityLevelSynthesisInfosMap[level]?.[targetId] : (synthesisJson[targetId] || []))?.forEach(synthesisInfo => {
        const res = SynthesisCalculator.calculateSynthesisLink({
          allSynthesisLinks,
          materialIds,
          synthesisInfo,
          allowLack,
        });
        if (res && res.k >= (allowLack ? 0 : 2)) {
          calculateSynthesisLinkInfos.push(res);
        }
      })
      if (calculateSynthesisLinkInfos.length > 0) {
        if (!levelCalculateSynthesisLinkInfos[level]) {
          levelCalculateSynthesisLinkInfos[level] = {};
        }
        SynthesisCalculator.prioritySort(calculateSynthesisLinkInfos);
        levelCalculateSynthesisLinkInfos[level][targetId] = calculateSynthesisLinkInfos;
      }
    }

    return levelCalculateSynthesisLinkInfos;
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
   * @param {LevelCalculateSynthesisLinkInfosMap} levelCalculateSynthesisLinkInfosMap
   * @param {number} showMax
   * @returns {string}
   */
  format({levelCalculateSynthesisLinkInfosMap, showMax = 10}) {
    if (showMax > 30) {
      showMax = 30;
    }

    const levels = Object.keys(levelCalculateSynthesisLinkInfosMap || {});
    if (levels.length < 1) {
      return "no result\n";
    }
    levels.sort((a, b) => b - a);

    let content = '';
    for (let level of levels) {
      const calculateSynthesisLinkInfosMap = levelCalculateSynthesisLinkInfosMap[level];
      for (let id in calculateSynthesisLinkInfosMap) {
        const calculateSynthesisLinkInfos = calculateSynthesisLinkInfosMap[id];
        content += ` 🌠 ${allJson[id]?.name}`;
        content += showMax === 1 ? '' : '\n';
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
      }
    }

    return content;
  },
  SpecialAbilityType: {
    'DeductReload': '系统骇入',
    'HealSelfHp': '紧急自救',
    'HealSameRoomCharacters': '天降甘霖',
    'AddReload': '紧急加速',
    'DamageToRoom': '超级拆迁',
    'HealRoomHp': '紧急修复',
    'DamageToSameRoomCharacters': '毒气',
    'None': '无',
    'DamageToCurrentEnemy': '致命一击',
    'FireWalk': '烈焰足迹',
    'Freeze': '冻结冲击',
    'Bloodlust': '血之渴望',
    'SetFire': '纵火',
    'ProtectRoom': '静电护盾',
    'Invulnerability': '相位闪现'
  },
  GenderType: {'Female': '女', 'Male': '男', 'Unknown': '没有'},
  EquipmentMask: ['头部', '胸部', '腿部', '手部', '饰品', '宠物'],
  sortKey: {
    '生命': 'FinalHp',
    '攻击': 'FinalAttack',
    '维修': 'FinalRepair',
    '能力': 'SpecialAbilityFinalArgument',
    '导航': 'FinalPilot',
    '科技': 'FinalScience',
    '引擎': 'FinalEngine',
    '武器': 'FinalWeapon',
    '抗性': 'FireResistance',
    '速度': 'RunSpeed',
    '训练': 'TrainingCapacity',
  },
  /**
   *
   * @param {RoleInfo} roleInfo
   * @return {string[]}
   */
  equipmentPosition(roleInfo) {
    const ep = [];
    const equipmentMask = Number(roleInfo.msg.EquipmentMask || 0).toString(2).split('').reverse();
    equipmentMask.forEach((mask, i) => {
      if (mask === `1`) {
        ep.push(SynthesisCalculator.EquipmentMask[i])
      }
    });
    return ep;
  },
  /**
   *
   * @param {string} names
   * @param {Level} targetLevel
   * @param {boolean} diff
   * @param {boolean} isSearch
   * @param {string} [sort]
   * @return {string}
   */
  showRoleInfo({names = '', targetLevel, diff = false, isSearch = false, sort}) {
    let ids;
    let size;
    if (!isSearch) {
      ids = SynthesisCalculator.namesToIds(names);
      size = ids.length;
      if (size < 1) {
        return "no result\n";
      }
    } else {
      ids = [];
      if (names) {
        const search = names.replace(/\s+/g, ' ').split(/\s*[\s，。；,.;|]\s*/g);
        for (let id in allJson) {
          const roleInfo = allJson[id];
          const specialAbility = SynthesisCalculator.SpecialAbilityType[roleInfo.msg.SpecialAbilityType];
          const ep = SynthesisCalculator.equipmentPosition(roleInfo);
          let match = true;
          for (let s of search) {
            if (!ep.includes(s) && specialAbility !== s) {
              match = false;
              break;
            }
          }
          if (match) {
            ids.push(id);
          }
        }
      } else {
        for (let id in allJson) {
          ids.push(id);
        }
      }

      size = Math.min(3, ids.length);
    }
    if (!Strings.isEmpty(targetLevel)) {
      const idsMap = SynthesisCalculator.getLevelIdsMap()[targetLevel];
      ids = ids.filter(id => idsMap.includes(id));
    }
    if (sort && SynthesisCalculator.sortKey[sort]) {
      ids.sort((a, b) => allJson[b].msg[SynthesisCalculator.sortKey[sort]] - allJson[a].msg[SynthesisCalculator.sortKey[sort]])
    }
    let content = ''
    for (let i = 0; i < size; i++) {
      const id = ids[i];
      const roleInfo = allJson[id];
      const msg = roleInfo.msg;

      if (diff && i > 0) {
        const fMsg = allJson[ids[i - 1]].msg
        content += '-----------\n';
        content += ` 生命 ${new Big(fMsg.FinalHp).minus(msg.FinalHp)}`
        content += ` 攻击 ${new Big(fMsg.FinalAttack).minus(msg.FinalAttack)}`
        content += ` 维修 ${new Big(fMsg.FinalRepair).minus(msg.FinalRepair)}`
        content += ` 能力 ${new Big(fMsg.SpecialAbilityFinalArgument).minus(msg.SpecialAbilityFinalArgument)}\n`

        content += ` 导航 ${new Big(fMsg.FinalPilot).minus(msg.FinalPilot)}`
        content += ` 科技 ${new Big(fMsg.FinalScience).minus(msg.FinalScience)}`
        content += ` 引擎 ${new Big(fMsg.FinalEngine).minus(msg.FinalEngine)}`
        content += ` 武器 ${new Big(fMsg.FinalWeapon).minus(msg.FinalWeapon)}\n`

        content += ` 抗性 ${new Big(fMsg.FireResistance).minus(msg.FireResistance)}`
        content += ` 速度 ${new Big(fMsg.WalkingSpeed).minus(msg.WalkingSpeed)}/${new Big(fMsg.RunSpeed).minus(msg.RunSpeed)}\n`
        content += '-----------\n';
      }

      content += ` 🌠 ${roleInfo.name}`;
      content += ' ' + SynthesisCalculator.equipmentPosition(roleInfo).join(' ');
      content += '\n';

      content += ` 技能 ${SynthesisCalculator.SpecialAbilityType[msg.SpecialAbilityType] || msg.SpecialAbilityType}`;
      content += ` 训练 ${msg.TrainingCapacity}\n`;

      content += ` 生命 ${msg.Hp}/${msg.FinalHp}`;
      content += ` 攻击 ${msg.Attack}/${msg.FinalAttack}`;
      content += ` 维修 ${msg.Repair}/${msg.FinalRepair}`;
      content += ` 能力 ${msg.SpecialAbilityArgument}/${msg.SpecialAbilityFinalArgument}\n`;

      content += ` 导航 ${msg.Pilot}/${msg.FinalPilot}`;
      content += ` 科技 ${msg.Science}/${msg.FinalScience}`;
      content += ` 引擎 ${msg.Engine}/${msg.FinalEngine}`;
      content += ` 武器 ${msg.Weapon}/${msg.FinalWeapon}\n`;

      content += ` 抗性 ${msg.FireResistance}`;
      content += ` 速度 ${msg.WalkingSpeed}/${msg.RunSpeed}\n`;
    }

    return content;
  },
  async marketList() {
    const res = await fetch("http://mobileapi.pixship.anjy.net/MessageService/ListActiveMarketplaceMessages5?itemSubType=None&rarity=None&currencyType=Unknown&itemDesignId=0&userId=0&accessToken=12345678-1234-1234-1234-123456789012");
    const text = await res.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: ""
    });
    const json = parser.parse(text);
    const messages = json?.MessageService?.ListActiveMarketplaceMessages?.Messages.Message;
    if (!messages || messages.length < 1) {
      return "no result\n";
    }
    let content = '';
    messages.forEach((message) => {
      content += message.Message.replace('在卖 ', '');
      content += ' ';
      content += message.ActivityArgument
        .replace('starbux', '票')
        .replace('gas', '油')
        .replace('mineral', '矿')
        .replace(/(\d{4})$/, ',$1');
      content += ' ';
      content += message.UserName;
      content += '\n';
    });

    return content;
  },
  async downloadData() {
    const all = await (await fetch('https://ps.gamesun.cn/synthesis/json/all.json')).json();
    const level = await (await fetch('https://ps.gamesun.cn/synthesis/json/level/level.json')).json();

    const synthesis = {};
    for (let id in all) {
      const toListRes = await fetch(`https://ps.gamesun.cn/synthesis/json/to/${id}.json`);
      if (!toListRes.ok) {
        continue;
      }
      try {
        let toList = (await toListRes.json())?.Prestige;
        if (!toList) {
          continue;
        }
        for (let i in toList) {
          toList[i] = toList[i]._attributes
        }
        synthesis[id] = toList;
      } catch (e) {
      }
    }
    await fs.writeFile(allJsonPath, JSON.stringify(all));
    await fs.writeFile(levelJsonPath, JSON.stringify(level));
    await fs.writeFile(synthesisJsonPath, JSON.stringify(synthesis));
    allJson = all;
    levelJson = level;
    synthesisJson = synthesis;
    SynthesisCalculator.levelIdsMap = null;
    SynthesisCalculator.nameMap = null;
    SynthesisCalculator.nameRMap = null;
  }
}

module.exports = SynthesisCalculator;
