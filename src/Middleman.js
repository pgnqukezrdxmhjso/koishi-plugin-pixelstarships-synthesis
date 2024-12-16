const SynthesisCalculator = require("./SynthesisCalculator.js");
const sleep = async (item) => new Promise(resolve => setTimeout(resolve, item));
const S = {
  calculating: false,
  config: null,
  timeoutIds: [],
  async calculateLock({ needMessageDelete, session, getContent }) {
    if (S.calculating) {
      session.send("calculating, please wait.");
      return;
    }
    try {
      S.calculating = true;
      const content = await getContent();
      let msg = content;
      if (needMessageDelete && S.config?.messagePacking) {
        msg = `<message forward><message>${msg}</message></message>`;
      }
      let messageIds = (await session.send(msg)) || [];
      if (messageIds.length < 1 && content.includes("🌠")) {
        const rows = content.split(/(?= 🌠)/);
        if (rows.length > 10) {
          while (rows.length > 1) {
            msg = rows.splice(0, 10).join("");
            if (needMessageDelete && S.config?.messagePacking) {
              msg = `<message forward><message>${msg}</message></message>`;
            }
            messageIds.push(...((await session.send(msg)) || []));
            await sleep(500);
          }
        }
      }
      if (needMessageDelete && S.config?.messageDeleteTime > 0 && messageIds.length > 0) {
        const timeoutId = setTimeout(() => {
          messageIds.forEach((messageId) => session.bot.deleteMessage(session.channelId, messageId));
          S.timeoutIds.splice(S.timeoutIds.indexOf(timeoutId), 1);
        }, S.config.messageDeleteTime * 1000);
        S.timeoutIds.push(timeoutId);
      }
    } catch (e) {
      if (e?.msg) {
        session.send(e?.msg);
      } else {
        session.send("Calculation exception");
        throw e;
      }
    } finally {
      S.calculating = false;
    }
  },
  onDispose() {
    const timeoutIds = S.timeoutIds;
    S.timeoutIds = [];
    timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
  },
  synthesis({ session, options }, target, material) {
    return S.calculateLock({
      needMessageDelete: true,
      session,
      getContent: () =>
        SynthesisCalculator.format({
          showMax: options.showMax,
          levelCalculateSynthesisLinkInfosMap: SynthesisCalculator.calculate({
            targetNames: target,
            materialNames: material,
            showMax: options.showMax
          })
        })
    });
  },
  possibility({ session, options }, material) {
    return S.calculateLock({
      needMessageDelete: true,
      session,
      getContent: () =>
        SynthesisCalculator.format({
          showMax: options.showMax,
          levelCalculateSynthesisLinkInfosMap: SynthesisCalculator.calculate({
            targetLevel: options.targetLevel,
            materialNames: material,
            allowLack: false,
            showMax: options.showMax
          })
        })
    });
  },
  showRoleInfo({ session, options }, names) {
    return S.calculateLock({
      needMessageDelete: options.showMax > 5,
      session,
      getContent: () =>
        SynthesisCalculator.showRoleInfo({
          names,
          targetLevel: options.targetLevel,
          diff: options.diff,
          isSearch: options.isSearch,
          sort: options.sort,
          showMax: options.showMax
        })
    });
  },
  marketList({ session, options }) {
    return S.calculateLock({
      needMessageDelete: true,
      session,
      getContent: () => SynthesisCalculator.marketList()
    });
  },
  lastDownloadData: null,
  downloadData({ session }) {
    if (
      S.lastDownloadData &&
      Date.now() - S.lastDownloadData < 60 * 60 * 1000
    ) {
      session.send("can only be updated once within 1 hour");
      return;
    }
    return S.calculateLock({
      session,
      getContent: async () => {
        session.send("start download data");
        await SynthesisCalculator.downloadData();
        S.lastDownloadData = Date.now();
        return "download completed";
      }
    });
  }
};
module.exports = S;
