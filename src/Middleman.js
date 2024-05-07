const S = {
  needInit: true,
  esmPool: {},
  SynthesisCalculator: null,
  PossibilityCalculator: null,
  calculating: false,
  async loadESM(path) {
    if (!S.esmPool[path]) {
      S.esmPool[path] = (await import(path)).default
    }
    return S.esmPool[path];
  },
  async init() {
    if (!S.needInit) {
      return;
    }
    S.needInit = false;
    S.SynthesisCalculator = await S.loadESM("./SynthesisCalculator.mjs")
    S.PossibilityCalculator = await S.loadESM("./PossibilityCalculator.mjs")
  },
  splitMaterial({material, options}) {
    return options.noSpaces ? material.split(/\s*[，。；,.;|]\s*/g) : material.split(/\s*[\s，。；,.;|]\s*/g)
  },
  async calculateLock({session, f}) {
    if (S.calculating) {
      session.send('calculating, please wait.');
      return;
    }
    try {
      S.calculating = true;
      await f();
    } catch (e) {
      session.send('Calculation exception');
      throw e;
    } finally {
      S.calculating = false;
    }
  },
  async synthesis({session, options}, target, material) {
    await S.init();
    const materialNames = S.splitMaterial({material, options});
    const errorNames = S.SynthesisCalculator.verifyNames(materialNames);
    if (errorNames.length > 0) {
      session.send('wrong name:' + errorNames.join(', '));
      return;
    }
    await S.calculateLock({
      session,
      f: async () => {
        const startTime = Date.now();
        const calculateSynthesisLinkInfos = await S.SynthesisCalculator._calculate({
          targetName: target,
          materialNames,
        })
        const content = S.SynthesisCalculator.format({
          calculateSynthesisLinkInfos: calculateSynthesisLinkInfos,
          showMax: options.showMax
        });
        await session.send(content + (Date.now() - startTime) / 1000 + 's');
      }
    })
  },
  async possibility({session, options}, material) {
    await S.init();
    const materialNames = S.splitMaterial({material, options});
    const errorNames = S.SynthesisCalculator.verifyNames(materialNames);
    if (errorNames.length > 0) {
      session.send('wrong name:' + errorNames.join(', '));
      return;
    }
    await S.calculateLock({
      session,
      f: async () => {
        const startTime = Date.now();
        const content = S.PossibilityCalculator.format({
          levelCalculateSynthesisLinkInfos: S.PossibilityCalculator.calculate({
            materialNames,
            targetLevel: options.targetLevel,
          }),
          showMax: options.showMax,
        });
        await session.send(content + (Date.now() - startTime) / 1000 + 's');
      }
    })
  }
}
module.exports = S;
