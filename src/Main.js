const SynthesisCalculator = require("./SynthesisCalculator");
const PossibilityCalculator = require("./PossibilityCalculator");
let calculating = false;

const calculate = async ({session, options}, mode, ...args) => {
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
      synthesisRoutes: SynthesisCalculator.calculate({
        targetName: args[0],
        materialNames: materialNames
      }),
      showMax: options.showMax
    })
  } else {
    content = PossibilityCalculator.format({
      levelSynthesisRouteInfos: PossibilityCalculator.calculate({
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
  try {
    if (calculating) {
      session.send('calculating, please wait.');
      return;
    }
    calculating = true;
    await calculate({session, options}, mode, ...args);
  } catch (e) {
    session.send('Calculation exception');
    throw e;
  } finally {
    calculating = false;
  }
}

module.exports = _calculate
