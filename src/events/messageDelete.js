import { Events } from 'discord.js';
import { logEvent, EVENT_TYPES } from '../services/loggingService.js';
import { logger } from '../utils/logger.js';
import { getReactionRoleMessage, deleteReactionRoleMessage } from '../services/reactionRoleService.js';

const MAX_LOGGED_MESSAGE_CONTENT_LENGTH = 1024;

export default {
  name: Events.MessageDelete,
  once: false,

  async execute(message) {
    try {
      if (!message.guild) return;

      try {
        const reactionRoleData = await getReactionRoleMessage(message.client, message.guild.id, message.id);
        if (reactionRoleData) {
          await deleteReactionRoleMessage(message.client, message.guild.id, message.id);
          logger.info(`Очищена запись в базе данных ролей по реакциям для удаленного вручную сообщения ${message.id} на сервере ${message.guild.id}`);

          try {
            await logEvent({
              client: message.client,
              guildId: message.guild.id,
              eventType: EVENT_TYPES.REACTION_ROLE_DELETE,
              data: {
                description: `Сообщение с выдачей ролей по реакциям было удалено вручную и удалено из базы данных.`,
                channelId: message.channel?.id,
                fields: [
                  {
                    name: '🗑️ ID сообщения',
                    value: message.id,
                    inline: true
                  },
                  {
                    name: '📍 Канал',
                    value: message.channel ? `${message.channel.toString()} (${message.channel.id})` : 'Неизвестно',
                    inline: true
                  },
                  {
                    name: '🧹 Очистка',
                    value: 'Запись в базе данных удалена автоматически',
                    inline: false
                  }
                ]
              }
            });
          } catch (logCleanupError) {
            logger.warn('Не удалось записать в лог очистку ролей по реакциям после ручного удаления сообщения:', logCleanupError);
          }
        }
      } catch (reactionRoleCleanupError) {
        logger.warn(`Не удалось очистить данные ролей по реакциям для удаленного сообщения ${message.id}:`, reactionRoleCleanupError);
      }

      if (message.author?.bot) return;

      const fields = [];

      
      if (message.author) {
        fields.push({
          name: '👤 Автор',
          value: `${message.author.tag} (${message.author.id})`,
          inline: true
        });
      }

      
      fields.push({
        name: '💬 Канал',
        value: `${message.channel.toString()} (${message.channel.id})`,
        inline: true
      });

      
      if (message.content) {
        const content = message.content.length > MAX_LOGGED_MESSAGE_CONTENT_LENGTH 
          ? message.content.substring(0, MAX_LOGGED_MESSAGE_CONTENT_LENGTH - 3) + '...' 
          : message.content;
        fields.push({
          name: '📝 Содержание',
          value: content || '*(пустое сообщение)*',
          inline: false
        });
      }

      
      fields.push({
        name: '🆔 ID сообщения',
        value: message.id,
        inline: true
      });

      
      fields.push({
        name: '📅 Создано',
        value: `<t:${Math.floor(message.createdTimestamp / 1000)}:R>`,
        inline: true
      });

      
      if (message.attachments.size > 0) {
        fields.push({
          name: '📎 Вложения',
          value: message.attachments.size.toString(),
          inline: true
        });
      }

      await logEvent({
        client: message.client,
        guildId: message.guild.id,
        eventType: EVENT_TYPES.MESSAGE_DELETE,
        data: {
          description: `Сообщение было удалено в ${message.channel.toString()}`,
          userId: message.author?.id,
          channelId: message.channel.id,
          fields
        }
      });

    } catch (error) {
      logger.error('Ошибка в событии messageDelete:', error);
    }
  }
};
