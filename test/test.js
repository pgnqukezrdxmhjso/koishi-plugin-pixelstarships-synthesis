const SynthesisCalculator = require("../src/SynthesisCalculator");
(() => {

  let k = 1;
  let tc = 0;

  // for (let i = 0; i < k; i++) {
  //   const st = Date.now();
  //   const possibility = SynthesisCalculator.calculate({
  //     targetLevel: 7,
  //     allowLack: false,
  //     // materialNames: '虫女士 美杜莎 虫族船长 狡猾的女孩 克雷先森 猫男 宇航员 男护士 僵尸，僵尸尸尸，僵尸尸尸，僵尸尸尸，圣堂星际女猎手，圣堂星际女猎手，坏叔叔，坏弗拉德，大史莱姆，她她她，灰人艺术大师,程序员文加，董卓，蒂凡尼，薇薇安，虫先生，虫女士。虫女士，麦当劳，麦当劳，易司令，丘比特骑兵'
  //     materialNames: '博根,大熊座,樱,休 哈利路亚,洪吉童,石头人,苏打服务器,易司令,鑫'
  //   });
  //   console.log(SynthesisCalculator.format({
  //     levelCalculateSynthesisLinkInfosMap: possibility,
  //     showMax: 1,
  //   }));
  //   tc += Date.now() - st;
  // }
  //
  // console.log('\n\n\n\n\n\n\n\n\n\n');
  // console.log(tc / k);
  // console.log('\n');

  k = 1;
  tc = 0;
  for (let i = 0; i < k; i++) {
    const st = Date.now();
    const synthesis = SynthesisCalculator.calculate({
      targetNames: '银傻逼 宇宙的意志 银河精灵',
      materialNames: '休哈利油,没被感染的海燕,僵尸，僵尸尸尸，僵尸尸尸，僵尸尸尸，圣堂星际女猎手，圣堂星际女猎手，坏叔叔，坏弗拉德，大史莱姆，她她她，灰人艺术大师,程序员文加，董卓，蒂凡尼，薇薇安，虫先生，虫女士。虫女士，麦当劳，麦当劳，易司令，丘比特骑兵'
    });
    console.log(SynthesisCalculator.format({
      levelCalculateSynthesisLinkInfosMap: synthesis,
      showMax: 5
    }));
    console.log(Date.now() - st)
    tc += Date.now() - st;
  }
  console.log(tc / k);

})()
