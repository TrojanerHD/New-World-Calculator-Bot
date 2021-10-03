import Command from './Command';
import PingCommand from './PingCommand';
import DiscordClient from '../DiscordClient';
import {
  ApplicationCommand,
  ApplicationCommandData,
  GuildResolvable,
  Message,
  Role,
  Snowflake,
  TextChannel,
} from 'discord.js';
import Settings from '../Settings';
import CommandPermissions from './CommandPermissions';
import LogCommand, { UserData } from './LogCommand';
import EtaCommand from './EtaCommand';

export type ApplicationCommandType = ApplicationCommand<{
  guild: GuildResolvable;
}>;

export default class MessageHandler {
  static _commands: Command[] = [
    new PingCommand(),
    new LogCommand(),
    new EtaCommand(),
  ];

  constructor() {
    DiscordClient._client.on('messageCreate', this.onMessage.bind(this));
  }

  private onMessage(message: Message): void {
    if (message.author.bot) return;
    if (message.content === '!deploy' && !!message.guild) {
      if (
        !message.member!.roles.cache.find((role: Role): boolean =>
          Settings.getSettings()['permission-roles'].includes(role.name)
        )
      ) {
        message
          .reply({
            content: 'You do not have the permission to perform this command',
            allowedMentions: { repliedUser: false },
          })
          .catch(console.error);
        return;
      }
      MessageHandler.addCommands();
      message
        .reply({
          content: 'Commands deployed',
          allowedMentions: { repliedUser: false },
        })
        .catch(console.error);
    }
    const userId: Snowflake = message.author.id;
    if (
      LogCommand._logs.has(userId) &&
      LogCommand._logs.get(userId)?.channel.id === message.channelId
    ) {
      if (message.content === '0') {
        LogCommand.stopLogging(userId);
        return;
      }
      const log: UserData = LogCommand._logs.get(userId)!;
      if (
        (log.times.length >= 1 &&
          Number(message.content) >= log.times[log.times.length - 1].position) ||
        isNaN(Number(message.content))
      ) {
        message.react('❌').catch(console.error);
        return;
      }
      log.times.push({
        date: message.createdAt,
        position: Number(message.content),
      });
      LogCommand._logs.set(userId, log);
      message.react('✅').catch(console.error);
      if (message.channel.type === 'GUILD_TEXT')
        (message.channel as TextChannel)
          .setTopic(EtaCommand.calculateEta(userId).reply)
          .catch(console.error);
    }
  }

  public static addCommands(): void {
    const guildCommands: ApplicationCommandData[] = MessageHandler._commands
      .filter((command: Command): boolean => command.guildOnly)
      .map((command: Command): ApplicationCommandData => command.deploy);

    const dmCommands: ApplicationCommandData[] = MessageHandler._commands
      .filter((command: Command): boolean => !command.guildOnly)
      .map((command: Command): ApplicationCommandData => command.deploy);

    DiscordClient._client.application?.commands.set(dmCommands);

    for (const guild of DiscordClient._client.guilds.cache.toJSON()) {
      guild.commands
        .fetch()
        .then((): void => {
          const commandPermissions: CommandPermissions = new CommandPermissions(
            guild
          );
          guild.commands
            .set(guildCommands)
            .then(commandPermissions.onCommandsSet.bind(commandPermissions))
            .catch(console.error);
        })
        .catch(console.error);
    }
  }
}
