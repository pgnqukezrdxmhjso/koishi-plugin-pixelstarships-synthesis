const SynthesisCalculator = require("./SynthesisCalculator.js");
const S = {
  calculating: false,
  async calculateLock({session, f}) {
    if (S.calculating) {
      session.send('calculating, please wait.');
      return;
    }
    try {
      S.calculating = true;
      await f();
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
  synthesis({session, options}, target, material) {
    return S.calculateLock({
      session,
      f: () => {
        const startTime = Date.now();
        const content = SynthesisCalculator.format({
          showMax: options.showMax,
          levelCalculateSynthesisLinkInfosMap: SynthesisCalculator.calculate({
            targetNames: target,
            materialNames: material,
          }),
        });
        session.send(content);
      }
    })
  },
  possibility({session, options}, material) {
    return S.calculateLock({
      session,
      f: () => {
        const content = SynthesisCalculator.format({
          showMax: options.showMax,
          levelCalculateSynthesisLinkInfosMap: SynthesisCalculator.calculate({
            targetLevel: options.targetLevel,
            materialNames: material,
            allowLack: false,
          }),
        });
        session.send(content);
      }
    })
  },
  showRoleInfo({session, options}, names) {
    S.calculateLock({
      session,
      f: () => {
        const content = SynthesisCalculator.showRoleInfo({
          names
        });
        session.send(content);
      }
    })
  },
  marketList({session, options}) {
    return S.calculateLock({
      session,
      f: async () => {
        const content = await SynthesisCalculator.marketList();
        session.send(content);
      }
    });
  },
}
module.exports = S;
