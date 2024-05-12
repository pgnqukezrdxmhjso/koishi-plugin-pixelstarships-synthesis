import {Context, Schema} from 'koishi'
import Middleman from './Middleman.js'

export const name = 'pixelstarships-synthesis'

export interface Config {
}

export const Config: Schema<Config> = Schema.object({})


export function apply(ctx: Context) {
  ctx.command('pixelstarships.synthesis <target> <material:text>')
    .option('showMax', '-m <showMax:number> maximum 60', {fallback: 5})
    .action(async (argv, target, material) => {
        if (!target || !material) {
          await argv.session.execute('pixelstarships.synthesis -h');
          return;
        }
        await Middleman.synthesis(argv, target, material)
      }
    );
  ctx.command('pixelstarships.possibility <material:text>')
    .option('targetLevel', '-t <targetLevel:number> maximum 7', {fallback: 7})
    .option('showMax', '-m <showMax:number> maximum 6', {fallback: 1})
    .action(async (argv, material) => {
        if (!material) {
          await argv.session.execute('pixelstarships.possibility -h');
          return;
        }
        await Middleman.possibility(argv, material);
      }
    );
  ctx.command('pixelstarships.showRoleInfo <name:text>')
    .action(async (argv, name) => {
        if (!name) {
          await argv.session.execute('pixelstarships.showRoleInfo -h');
          return;
        }
        await Middleman.showRoleInfo(argv, name);
      }
    );
  ctx.command('pixelstarships.marketList')
    .action(async (argv) => {
        if (!name) {
          await argv.session.execute('pixelstarships.marketList -h');
          return;
        }
        await Middleman.marketList(argv);
      }
    );
}
