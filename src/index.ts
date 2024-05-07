import {Context, Schema} from 'koishi'
import Middleman from './Middleman.js'

export const name = 'pixelstarships-synthesis'

export interface Config {
}

export const Config: Schema<Config> = Schema.object({})


export function apply(ctx: Context) {
  ctx.command('pixelstarshipsSynthesis <target> <material:text>')
    .option('showMax', '-m <showMax:number> maximum 60', {fallback: 6})
    .option('noSpaces', '-n',)
    .action(async (argv, target, material) => {
        if (!target || !material) {
          await argv.session.execute('pixelstarshipsSynthesis -h');
          return;
        }
        await Middleman.synthesis(argv, target, material)
      }
    );
  ctx.command('pixelstarshipsPossibility <material:text>')
    .option('targetLevel', '-t <targetLevel:number> maximum 7', {fallback: 7})
    .option('showMax', '-m <showMax:number> maximum 6', {fallback: 1})
    .option('noSpaces', '-n <noSpaces:boolean>')
    .action(async (argv, material) => {
        if (!material) {
          await argv.session.execute('pixelstarshipsPossibility -h');
          return;
        }
        await Middleman.possibility(argv, material);
      }
    );
}
