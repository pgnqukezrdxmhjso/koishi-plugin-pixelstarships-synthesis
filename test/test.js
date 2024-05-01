const SynthesisCalculator = require("../src/SynthesisCalculator");
const PossibilityCalculator = require("../src/PossibilityCalculator");

console.time();
const possibility = PossibilityCalculator.calculate({
  targetLevel: 7,
  materialNames: '僵尸，僵尸尸尸，僵尸尸尸，僵尸尸尸，圣堂星际女猎手，圣堂星际女猎手，坏叔叔，坏弗拉德，大史莱姆，她她她，灰人艺术大师,程序员文加，董卓，蒂凡尼，薇薇安，虫先生，虫女士。虫女士，麦当劳，麦当劳，易司令，丘比特骑兵'.split(/\s*[，。；,.;|]\s*/g)
})
console.log(PossibilityCalculator.format({
  levelSynthesisRouteInfos: possibility,
  showMax: 1,
}));
console.timeEnd();

console.time();
const synthesis = SynthesisCalculator.calculate({
  showMax: 9999,
  targetName: '宇宙意志',
  materialNames: '僵尸，僵尸尸尸，僵尸尸尸，僵尸尸尸，圣堂星际女猎手，圣堂星际女猎手，坏叔叔，坏弗拉德，大史莱姆，她她她，灰人艺术大师,程序员文加，董卓，蒂凡尼，薇薇安，虫先生，虫女士。虫女士，麦当劳，麦当劳，易司令，丘比特骑兵'.split(/\s*[，。；,.;|]\s*/g)
});
console.log(SynthesisCalculator.format({synthesisRoutes: synthesis}))
console.timeEnd();
