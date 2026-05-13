import { UpdateTimePlugin } from '../plugin'
import { registerBackfillPropertiesCommand } from './backfill-properties'

export function registerCommands(plugin: UpdateTimePlugin): void {
    registerBackfillPropertiesCommand(plugin)
}
