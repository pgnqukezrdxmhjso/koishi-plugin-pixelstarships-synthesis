import {Context, Schema} from 'koishi'
import Middleman from './Middleman.js'

export const name = 'pixelstarships-synthesis'

export interface Config {
}

export const Config: Schema<Config> = Schema.object({})


export function apply(ctx: Context) {
  ctx.command('pixelstarshipsSynthesis <target> <material:text>')
    .option('showMax', '-m <showMax:number> maximum 60', {fallback: 10})
    .action(async ({session, options}, target, material) => {
      await Middleman({session, options}, 1, [target, material])
    });
  ctx.command('pixelstarshipsPossibility <material:text>')
    .option('targetLevel', '-l <targetLevel:number> maximum 7', {fallback: 7})
    .option('showMax', '-m <showMax:number> maximum 6', {fallback: 3})
    .action(async ({session, options}, material) => {
      await Middleman({session, options}, 2, [material])
    });
}
