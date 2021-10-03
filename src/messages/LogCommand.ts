import {
  ApplicationCommandData,
  Collection,
  CommandInteractionOption,
  Interaction,
  Snowflake,
  TextBasedChannels,
  TextChannel,
} from 'discord.js';
import Command, { Reply } from './Command';

export interface UserData {
  times: {
    date: Date;
    position: number;
  }[];
  channel: TextBasedChannels;
}

export default class LogCommand extends Command {
  deploy: ApplicationCommandData = {
    name: 'log',
    description:
      'Log your login speeds to be able to let the bot calculate an estimate time',
    options: [
      {
        type: 1,
        name: 'start',
        description: 'Start logging',
        options: [],
      },
      {
        type: 1,
        name: 'cancel',
        description: 'Stop logging',
        options: [],
      },
    ],
  };

  //static readonly #logFile: string = './log.json';
  static _logs: Collection<Snowflake, UserData> = new Collection();

  handleCommand(
    args: readonly CommandInteractionOption[],
    interaction: Interaction
  ): Reply {
    const log: boolean = LogCommand._logs.has(interaction.user.id);
    switch (args[0].name) {
      case 'start':
        const outputMessage: string = `Send your current queue positions here <@${interaction.user.id}>\nLogging will automatically stop when you send 0\nWhile you are logging, you are able to use /eta everywhere`;
        if (log)
          return {
            reply: 'Error: Logging already started',
            ephemeral: true,
          };
        if (!interaction.inGuild()) {
          LogCommand._logs.set(interaction.user.id, {
            times: [],
            channel: interaction.channel!,
          });
          return {
            reply: outputMessage,
          };
        }
        interaction
          .guild!.channels.create(
            `log-${interaction.user.username.toLowerCase()}`,
            {
              type: 'GUILD_TEXT',
              permissionOverwrites: [
                { id: interaction.guild!.roles.everyone, deny: 'VIEW_CHANNEL' },
                { id: interaction.user.id, allow: 'VIEW_CHANNEL' },
              ],
            }
          )
          .then((channel: TextChannel): void => {
            LogCommand._logs.set(interaction.user.id, {
              times: [],
              channel,
            });
            channel.send(outputMessage).catch(console.error);
          })
          .catch(console.error);
        return {
          reply: 'Check your mentions',
          ephemeral: true,
        };
      case 'cancel':
        if (!log)
          return {
            reply: 'Error: You did not start logging',
            ephemeral: true,
          };
        LogCommand.stopLogging(interaction.user.id);
        return {
          reply: 'Logging canceled',
          ephemeral: true,
        };
      default:
        throw new Error('Interaction argument was neither start nor cancel');
    }
  }

  public static stopLogging(userId: Snowflake): void {
    if (!LogCommand._logs.has(userId)) return;
    const log: UserData = LogCommand._logs.get(userId)!;
    if (log.channel.type === 'GUILD_TEXT')
      log.channel.delete().catch(console.error);
    LogCommand._logs.delete(userId);
  }

  /*private loadLogs(): UserData[] {
    if (!fs.existsSync(LogCommand.#logFile)) {
      fs.writeFileSync(LogCommand.#logFile, '[]', 'utf8');
      return [];
    }
    const logs: string = fs.readFileSync(LogCommand.#logFile, 'utf8');

		if (!Settings.isJsonString(logs)) this.saveLogs();
  }
	
	private saveLogs(): void {
		fs.writeFileSync(LogCommand.#logFile, JSON.stringify(this.#logs), 'utf8');
	}*/
}
