import {
  Client,
  Collection,
  GuildChannel,
  Intents,
  ThreadChannel,
  ThreadMember,
} from 'discord.js';
import MessageHandler from './messages/MessageHandler';
import ReactionHandler from './ReactionHandler';

export default class DiscordClient {
  static _client: Client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.DIRECT_MESSAGES,
    ], partials: ['CHANNEL']
  });

  constructor() {
    new MessageHandler();
    new ReactionHandler();
    DiscordClient._client.on('threadCreate', this.onThreadCreate);
    DiscordClient._client.on('ready', this.onReady);
  }

  login(): void {
    DiscordClient._client.login(process.env.DISCORD_TOKEN).catch(console.error);
  }

  private onThreadCreate(thread: ThreadChannel): void {
    thread.join().catch(console.error);
  }

  private onReady(): void {
    for (const guild of DiscordClient._client.guilds.cache.toJSON()) {
      for (const threadChannel of (
        guild.channels.cache.filter(
          (channel: GuildChannel | ThreadChannel): boolean =>
            channel instanceof ThreadChannel &&
            !channel.members.cache.find(
              (member: ThreadMember): boolean =>
                member.user!.id === DiscordClient._client.user!.id
            )
        ) as Collection<string, ThreadChannel>
      ).toJSON())
        threadChannel.join().catch(console.error);

      for (const member of guild.members.cache.toJSON())
        member.user.dmChannel?.fetch().catch(console.error);

      if (!DiscordClient._client.application?.owner)
        DiscordClient._client.application
          ?.fetch()
          .then(MessageHandler.addCommands)
          .catch(console.error);
      else MessageHandler.addCommands();
    }
  }
}
