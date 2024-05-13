const SynthesisCalculator = require("./SynthesisCalculator.js");
const S = {
  calculating: false,
  config: null,
  timeoutIds: [],
  async calculateLock({needMessageDelete, session, getContent}) {
    if (S.calculating) {
      session.send('calculating, please wait.');
      return;
    }
    try {
      S.calculating = true;
      const content = await getContent();
      const [messageId] = await session.send(content);
      if (needMessageDelete && S.config?.messageDeleteTime > 0) {
        const timeoutId = setTimeout(() => {
          session.bot.deleteMessage(session.channelId, messageId);
          S.timeoutIds.splice(S.timeoutIds.indexOf(timeoutId), 1);
        }, S.config.messageDeleteTime * 1000)
        S.timeoutIds.push(timeoutId);
      }

    } catch (e) {
      if (e?.msg) {
        session.send(e?.msg);
      } else {
        session.send('Calculation exception');
        throw e;
      }
    } finally {
      S.calculating = false;
    }
  },
  onDispose() {
    const timeoutIds = S.timeoutIds;
    S.timeoutIds = [];
    timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
  },
  synthesis({session, options}, target, material) {
    return S.calculateLock({
      needMessageDelete: true,
      session,
      getContent: () => SynthesisCalculator.format({
        showMax: options.showMax,
        levelCalculateSynthesisLinkInfosMap: SynthesisCalculator.calculate({
          targetNames: target,
          materialNames: material,
        }),
      })
    })
  },
  possibility({session, options}, material) {
    return S.calculateLock({
      needMessageDelete: true,
      session,
      getContent: () => SynthesisCalculator.format({
        showMax: options.showMax,
        levelCalculateSynthesisLinkInfosMap: SynthesisCalculator.calculate({
          targetLevel: options.targetLevel,
          materialNames: material,
          allowLack: false,
        }),
      })
    })
  },
  showRoleInfo({session, options}, names) {
    return S.calculateLock({
      session,
      getContent: () => SynthesisCalculator.showRoleInfo({
        names
      })
    })
  },
  marketList({session, options}) {
    return S.calculateLock({
      needMessageDelete: true,
      session,
      getContent: () => SynthesisCalculator.marketList()
    });
  },
}
module.exports = S;
