import { CommandInteraction, Interaction } from 'discord.js';
import DiscordClient from './DiscordClient';
import { Reply } from './messages/Command';
import MessageHandler from './messages/MessageHandler';

export default class ReactionHandler {
  constructor() {
    DiscordClient._client.on('interactionCreate', this.onReaction.bind(this));
  }

  private onReaction(interaction: Interaction): void {
    if (!interaction.isCommand()) return;
    for (const command of MessageHandler._commands) {
      if (command.deploy.name === interaction.commandName) {
        const reply: Reply = command.handleCommand(
          interaction.options.data,
          interaction
        );
        if (!reply.ephemeral) reply.ephemeral = false;
        if (!reply.afterResponse) reply.afterResponse = (): void => {};
        interaction
          .reply({ content: reply.reply, ephemeral: reply.ephemeral })
          .then(reply.afterResponse.bind(command))
          .catch(console.error);
      }
    }
  }
}
