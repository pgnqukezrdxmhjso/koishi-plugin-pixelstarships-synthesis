import {Context, Schema} from 'koishi'
import Middleman from './Middleman.js'

export const name = 'pixelstarships-synthesis'

export interface Config {
  messageDeleteTime: number
}

export const Config: Schema<Config> = Schema.object({
  messageDeleteTime: Schema.number().description('message delete time(second,0 means no delete)').default(0),
});


export function apply(ctx: Context, config: Config) {
  Middleman.config = config;
  ctx.on('dispose', Middleman.onDispose);

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
    .option('targetLevel', '-t <targetLevel:number> maximum 7')
    .option('diff', '-d diff attribute')
    .option('isSearch', '-s search mode')
    .option('sort', '-o <sort:string> sort attribute')
    .action(async (argv, name) => {
        await Middleman.showRoleInfo(argv, name);
      }
    );
  ctx.command('pixelstarships.marketList')
    .action(async (argv) => {
        await Middleman.marketList(argv);
      }
    );
}
