(async () => {
  const PossibilityCalculator = (await import("../src/PossibilityCalculator.mjs")).default;
  const SynthesisCalculator = (await import("../src/SynthesisCalculator.mjs")).default;

  // let k = 1;
  // let tc = 0;
  // for (let i = 0; i < k; i++) {
  //   const st = Date.now();
  //   const possibility = await PossibilityCalculator.calculate({
  //     targetLevel: 7,
  //     materialNames: '虫女士 美杜莎 虫族船长 狡猾的女孩 克雷先森 猫男 宇航员 男护士 僵尸，僵尸尸尸，僵尸尸尸，僵尸尸尸，圣堂星际女猎手，圣堂星际女猎手，坏叔叔，坏弗拉德，大史莱姆，她她她，灰人艺术大师,程序员文加，董卓，蒂凡尼，薇薇安，虫先生，虫女士。虫女士，麦当劳，麦当劳，易司令，丘比特骑兵'.split(/\s*[\s，。；,.;|]\s*/g)
  //   })
  //   console.log(PossibilityCalculator.format({
  //     levelSynthesisRouteInfos: possibility,
  //     showMax: 2,
  //   }));
  //   tc += Date.now() - st;
  // }
  // console.log(tc / k);

  let k = 1;
  let tc = 0;
  for (let i = 0; i < k; i++) {
    const st = Date.now();
    const synthesis = await SynthesisCalculator.calculate({
      showMax: 9999,
      targetName: '宇宙意志',
      materialNames: '僵尸，僵尸尸尸，僵尸尸尸，僵尸尸尸，圣堂星际女猎手，圣堂星际女猎手，坏叔叔，坏弗拉德，大史莱姆，她她她，灰人艺术大师,程序员文加，董卓，蒂凡尼，薇薇安，虫先生，虫女士。虫女士，麦当劳，麦当劳，易司令，丘比特骑兵'.split(/\s*[\s，。；,.;|]\s*/g)
    });
    console.log(SynthesisCalculator.format({synthesisRouteInfos: synthesis}))
    console.log(Date.now() - st)
    tc += Date.now() - st;
  }
  console.log(tc / k);

})()
