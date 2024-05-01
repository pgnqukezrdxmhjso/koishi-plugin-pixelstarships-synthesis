import {Context, Schema} from 'koishi'
import Main from './Main.js'

export const name = 'pixelstarships-synthesis'

export interface Config {
}

export const Config: Schema<Config> = Schema.object({})


export function apply(ctx: Context) {
  ctx.command('pixelstarshipsSynthesis <target> <material:text>')
    .option('showMax', '-m <showMax:number> maximum 30', {fallback: 5})
    .action(async ({session, options}, target, material) => {
      await Main({session, options}, 1, [target, material])
    });
  ctx.command('pixelstarshipsPossibility <material:text>')
    .option('targetLevel', '-l <targetLevel:number> maximum 7', {fallback: 7})
    .option('showMax', '-m <showMax:number> maximum 6', {fallback: 3})
    .action(async ({session, options}, material) => {
      await Main({session, options}, 2, [material])
    });
}
