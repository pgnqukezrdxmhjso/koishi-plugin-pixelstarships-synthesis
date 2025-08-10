const SynthesisCalculator = require("../src/SynthesisCalculator");
(async () => {

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

  // k = 1;
  // tc = 0;
  // for (let i = 0; i < k; i++) {
  //   const st = Date.now();
  //   const synthesis = SynthesisCalculator.calculate({
  //     targetNames: '银傻逼 宇宙的意志 银河精灵',
  //     materialNames: '休哈利油,没被感染的海燕,僵尸，僵尸尸尸，僵尸尸尸，僵尸尸尸，圣堂星际女猎手，圣堂星际女猎手，坏叔叔，坏弗拉德，大史莱姆，她她她，灰人艺术大师,程序员文加，董卓，蒂凡尼，薇薇安，虫先生，虫女士。虫女士，麦当劳，麦当劳，易司令，丘比特骑兵'
  //   });
  //   console.log(SynthesisCalculator.format({
  //     levelCalculateSynthesisLinkInfosMap: synthesis,
  //     showMax: 5
  //   }));
  //   console.log(Date.now() - st)
  //   tc += Date.now() - st;
  // }
  // console.log(tc / k);

  // const t = SynthesisCalculator.showRoleInfo({names: '余烬女 粉红哥斯拉', diff: true})
  // const t = SynthesisCalculator.showRoleInfo({
  //   names: '头部',
  //   sort: '能力',
  //   isSearch: true
  // })
  // console.log(t);
  // const r = await SynthesisCalculator.marketList();
  // console.log(r)

  // await SynthesisCalculator.downloadData();

  console.time("5");
  console.log(
    SynthesisCalculator.format({
      calculateInfos: SynthesisCalculator.calculate({
        targetNames: "莱洛什，莱洛什，破败钢琴家，破败钢琴家，银河炼金术士，银河炼金术士，银河雪女，银河雪女，银河雪女，银河雪女，粉红哥斯拉，粉红哥斯拉，伊娃，伊娃，金刚，金刚，残奥会之神，残奥会之神，联合执政官，联合执政官，CPU，CPU，赛博鸭，赛博鸭，银河魅魔，银河魅魔，银河魅魔，银河魅魔",
        materialNames: '虫女士，维纳斯，西蒙，蝾螈王，虫女士，薇薇安薇薇安，艾米丽，维纳斯，灰人艺术大师，喵医生，卡塔利恩治疗者，北极男孩，北极男孩，北极男孩，蛇夫座，撒吉塔，雪莉酒，邪恶将军，西蒙，西蒙，虫族船长，虫族船长，虫族船长，虫族船长，虫族船长，虫女士，虫女士，虫女士，虫女士，虫先生，虫先生，薇薇安，薇薇安，莉比，艾米丽，艾米丽，艾米丽，艾米丽，耶稣，耶稣，耶稣，耶稣，罗槟娜之声，罗槟娜之声，罗槟娜之声，罗槟娜之声，罗槟娜之声，绅士，绅士，绅士，绅士，绅士，红忍者，男护士，男护士，灰人艺术大师，灰人艺术大师，灰人艺术大师，海燕舰长，海燕舰长，弥赛亚，弥赛亚，弥赛亚，弥赛亚，宇航员，宇航员，宇航员，宇航员，宇航员，宇航员，宇航员，宇航员，好学生，好学生，大妈，大副，大副，大副，大副，圣堂星际女猎手，圣堂星际女猎手，圣堂星际女猎手，圣堂星际女猎手，喵医生，卡拉，北极男孩，克里斯汀，克里斯汀，僵尸尸尸，丹尼斯，丹尼斯',
      })
    })
  );
  console.timeEnd("5");

})()
