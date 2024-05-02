const esmPool = {}
const loadESM = async (path) => {
  if (!esmPool[path]) {
    esmPool[path] = (await import(path)).default
  }
  return esmPool[path];
}

let calculating = false;
const calculate = async ({session, options}, mode, ...args) => {
  const SynthesisCalculator = await loadESM("./SynthesisCalculator.mjs")
  const PossibilityCalculator = await loadESM("./PossibilityCalculator.mjs")

  let material;
  if (mode === 1) {
    material = args[1];
  } else {
    material = args[0];
  }

  const materialNames = material.split(/\s*[\s，。；,.;|]\s*/g);
  if (materialNames.length > 10) {
    await session.send('There are too many materials, please wait.');
  }

  const startTime = Date.now()
  let content;
  if (mode === 1) {
    content = SynthesisCalculator.format({
      synthesisRouteInfos: await SynthesisCalculator.calculate({
        targetName: args[0],
        materialNames: materialNames
      }),
      showMax: options.showMax
    })
  } else {
    content = PossibilityCalculator.format({
      levelSynthesisRouteInfos: await PossibilityCalculator.calculate({
        materialNames: materialNames,
        targetLevel: options.targetLevel,
      }),
      showMax: options.showMax,
      level: options.targetLevel,
    })
  }

  await session.send(content + '\n' + (Date.now() - startTime) / 1000 + 's');
}

const _calculate = async ({session, options}, mode, args) => {
  if (calculating) {
    session.send('calculating, please wait.');
    return;
  }
  try {
    calculating = true;
    await calculate({session, options}, mode, ...args);
  } catch (e) {
    session.send('Calculation exception');
    throw e;
  } finally {
    calculating = false;
  }
}

module.exports = _calculate;
