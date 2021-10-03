import {
  ApplicationCommandData,
  CommandInteractionOption,
  Interaction,
} from 'discord.js';
import Command, { Reply } from './Command';

export default class PingCommand extends Command {
  deploy: ApplicationCommandData = {
    name: 'ping',
    description: 'Shows the current ping of the bot',
  };

  handleCommand(
    _args: readonly CommandInteractionOption[],
    interaction: Interaction
  ): Reply {
    return {
      reply: `My ping is ${Math.floor(
        new Date().getTime() - interaction.createdTimestamp
      )}ms`,
    };
  }
}
