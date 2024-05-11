const SynthesisCalculator = require("./SynthesisCalculator.js");
const S = {
  calculating: false,
  splitMaterial({material, options}) {
    return options.noSpaces ? material.split(/\s*[，。；,.;|]\s*/g) : material.split(/\s*[\s，。；,.;|]\s*/g)
  },
  calculateLock({session, f}) {
    if (S.calculating) {
      session.send('calculating, please wait.');
      return;
    }
    try {
      S.calculating = true;
      f();
    } catch (e) {
      session.send('Calculation exception');
      throw e;
    } finally {
      S.calculating = false;
    }
  },
  synthesis({session, options}, target, material) {
    const targetNames = S.splitMaterial({material: target, options});
    const materialNames = S.splitMaterial({material, options});
    const errorNames = SynthesisCalculator.verifyNames([...targetNames, ...materialNames]);
    if (errorNames.length > 0) {
      session.send('wrong name:' + errorNames.join(', '));
      return;
    }
    S.calculateLock({
      session,
      f: () => {
        const startTime = Date.now();
        const content = SynthesisCalculator.format({
          showMax: options.showMax,
          levelCalculateSynthesisLinkInfosMap: SynthesisCalculator.calculate({
            targetNames: targetNames,
            materialNames,
          }),
        });
        session.send(content + (Date.now() - startTime) / 1000 + 's');
      }
    })
  },
  possibility({session, options}, material) {
    const materialNames = S.splitMaterial({material, options});
    const errorNames = SynthesisCalculator.verifyNames(materialNames);
    if (errorNames.length > 0) {
      session.send('wrong name:' + errorNames.join(', '));
      return;
    }
    S.calculateLock({
      session,
      f: () => {
        const startTime = Date.now();
        const content = SynthesisCalculator.format({
          showMax: options.showMax,
          levelCalculateSynthesisLinkInfosMap: SynthesisCalculator.calculate({
            targetLevel: options.targetLevel,
            materialNames,
            allowLack: false,
          }),
        });
        session.send(content + (Date.now() - startTime) / 1000 + 's');
      }
    })
  }
}
module.exports = S;
