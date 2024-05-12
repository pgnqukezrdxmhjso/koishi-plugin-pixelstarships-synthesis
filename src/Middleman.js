const SynthesisCalculator = require("./SynthesisCalculator.js");
const S = {
  calculating: false,
  calculateLock({session, f}) {
    if (S.calculating) {
      session.send('calculating, please wait.');
      return;
    }
    try {
      S.calculating = true;
      f();
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
    S.calculateLock({
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
        session.send(content + (Date.now() - startTime) / 1000 + 's');
      }
    })
  },
  possibility({session, options}, material) {
    S.calculateLock({
      session,
      f: () => {
        const startTime = Date.now();
        const content = SynthesisCalculator.format({
          showMax: options.showMax,
          levelCalculateSynthesisLinkInfosMap: SynthesisCalculator.calculate({
            targetLevel: options.targetLevel,
            materialNames: material,
            allowLack: false,
          }),
        });
        session.send(content + (Date.now() - startTime) / 1000 + 's');
      }
    })
  }
}
module.exports = S;
