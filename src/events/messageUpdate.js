import { Events } from 'discord.js';
import { logEvent, EVENT_TYPES } from '../services/loggingService.js';
import { logger } from '../utils/logger.js';

const MAX_LOGGED_EDIT_CONTENT_LENGTH = 512;

export default {
  name: Events.MessageUpdate,
  once: false,

  async execute(oldMessage, newMessage) {
    try {
      if (!newMessage.guild || newMessage.author?.bot) return;

      
      if (oldMessage.content === newMessage.content) return;

      const fields = [];

      
      if (newMessage.author) {
        fields.push({
          name: '👤 Автор',
          value: `${newMessage.author.tag} (${newMessage.author.id})`,
          inline: true
        });
      }

      
      fields.push({
        name: '💬 Канал',
        value: `${newMessage.channel.toString()} (${newMessage.channel.id})`,
        inline: true
      });

      
      const oldContent = oldMessage.content || '*(пустое сообщение)*';
      const oldContentTruncated = oldContent.length > MAX_LOGGED_EDIT_CONTENT_LENGTH 
        ? oldContent.substring(0, MAX_LOGGED_EDIT_CONTENT_LENGTH - 3) + '...' 
        : oldContent;
      fields.push({
        name: '📝 Старое содержание',
        value: oldContentTruncated,
        inline: false
      });

      
      const newContent = newMessage.content || '*(пустое сообщение)*';
      const newContentTruncated = newContent.length > MAX_LOGGED_EDIT_CONTENT_LENGTH 
        ? newContent.substring(0, MAX_LOGGED_EDIT_CONTENT_LENGTH - 3) + '...' 
        : newContent;
      fields.push({
        name: '📝 Новое содержание',
        value: newContentTruncated,
        inline: false
      });

      
      fields.push({
        name: '🆔 ID сообщения',
        value: newMessage.id,
        inline: true
      });

      await logEvent({
        client: newMessage.client,
        guildId: newMessage.guild.id,
        eventType: EVENT_TYPES.MESSAGE_EDIT,
        data: {
          description: `Сообщение было изменено в ${newMessage.channel.toString()}`,
          userId: newMessage.author?.id,
          channelId: newMessage.channel.id,
          fields
        }
      });

    } catch (error) {
      logger.error('Ошибка в событии messageUpdate:', error);
    }
  }
};
