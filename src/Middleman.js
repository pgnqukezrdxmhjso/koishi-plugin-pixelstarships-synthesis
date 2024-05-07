const PossibilityCalculator = require("./PossibilityCalculator.js");
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
          calculateSynthesisLinkInfos: SynthesisCalculator.calculate({
            targetName: target,
            materialNames,
          }),
          showMax: options.showMax
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
        const content = PossibilityCalculator.format({
          levelCalculateSynthesisLinkInfos: PossibilityCalculator.calculate({
            materialNames,
            targetLevel: options.targetLevel,
          }),
          showMax: options.showMax,
        });
        session.send(content + (Date.now() - startTime) / 1000 + 's');
      }
    })
  }
}
module.exports = S;
