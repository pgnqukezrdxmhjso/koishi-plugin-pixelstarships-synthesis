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
      let content = await getContent();
      if (needMessageDelete && S.config?.messagePacking) {
        content = `<message forward><message>${content}</message></message>`
      }
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
        names,
        targetLevel: options.targetLevel,
        diff: options.diff,
        isSearch: options.isSearch,
        sort: options.sort,
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
  lastDownloadData: null,
  downloadData({session}) {
    if (S.lastDownloadData && Date.now() - S.lastDownloadData < 60 * 60 * 1000) {
      session.send('can only be updated once within 1 hour');
      return;
    }
    return S.calculateLock({
      session,
      getContent: async () => {
        session.send('start download data');
        await SynthesisCalculator.downloadData();
        S.lastDownloadData = Date.now();
        return 'download completed';
      }
    });
  },
}
module.exports = S;
