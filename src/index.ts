import {Context, Schema} from 'koishi'
import SynthesisCalculator from './SynthesisCalculator.js'

export const name = 'pixelstarships-synthesis'

export interface Config {
}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.command('pixelstarshipsSynthesis <target> <material:text>')
    .option('showMax', '-m <showMax:number> maximum 30', {fallback: 5})
    .action(({options}, target, material = "") =>
      SynthesisCalculator.format({
        synthesisRoutes: SynthesisCalculator.calculate({
          targetName: target,
          materialNames: material.split(/\s*[,|]\s*/g)
        }),
        showMax: options.showMax
      }))
}
