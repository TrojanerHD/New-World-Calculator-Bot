import {
  ApplicationCommandData,
  CommandInteractionOption,
  Interaction,
  Snowflake,
} from 'discord.js';
import Command, { Reply } from './Command';
import LogCommand, { UserData } from './LogCommand';

export default class EtaCommand extends Command {
  deploy: ApplicationCommandData = {
    name: 'eta',
    description:
      'Show the eta until you are estimated to be logged in (only available if currently logging)',
    options: [
      {
        type: 6,
        name: 'user',
        description: 'Show eta of given user',
      },
    ],
  };
  handleCommand(
    args: readonly CommandInteractionOption[],
    interaction: Interaction
  ): Reply {
    if (args.length === 1 && args[0].user)
      return EtaCommand.calculateEta(args[0].user.id);
    return EtaCommand.calculateEta(interaction.user.id);
  }

  static calculateEta(userId: Snowflake): Reply {
    if (!LogCommand._logs.has(userId))
      return {
        reply: 'Error: No logging currently running',
        ephemeral: true,
      };

    const log: UserData = LogCommand._logs.get(userId)!;
    if (log.times.length <= 1)
      return {
        reply: 'Error: Not enough data to calculate estimate time',
        ephemeral: true,
      };

    let total: number = 0;
    for (let i: number = 1; i < log.times.length; ++i) {
      const point = log.times[i];
      const prevPoint = log.times[i - 1];
      total += Math.abs(
        (point.date.getTime() - prevPoint.date.getTime()) /
          (point.position - prevPoint.position)
      );
    }

    const date: Date = new Date();
    date.setTime(
      date.getTime() +
        log.times[log.times.length - 1].position *
          (total / (log.times.length - 1))
    );

    return {
      reply: `<@${userId}>'s queue is estimated to be finished at <t:${Math.round(
        date.getTime() / 1000
      )}:T> (<t:${Math.round(date.getTime() / 1000)}:R>)`,
    };
  }
}
