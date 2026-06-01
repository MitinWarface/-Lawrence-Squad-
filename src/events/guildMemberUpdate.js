import { Events } from 'discord.js';
import { logEvent, EVENT_TYPES } from '../services/loggingService.js';
import { logger } from '../utils/logger.js';

export default {
  name: Events.GuildMemberUpdate,
  once: false,

  async execute(oldMember, newMember) {
    try {
      if (!newMember.guild) return;

      const fields = [];

      
      fields.push({
        name: '👤 Участник',
        value: `${newMember.user.tag} (${newMember.user.id})`,
        inline: true
      });

      
      if (oldMember.nickname !== newMember.nickname) {
        fields.push({
          name: '🏷️ Старый никнейм',
          value: oldMember.nickname || '*(нет никнейма)*',
          inline: true
        });

        fields.push({
          name: '🏷️ Новый никнейм',
          value: newMember.nickname || '*(нет никнейма)*',
          inline: true
        });

        await logEvent({
          client: newMember.client,
          guildId: newMember.guild.id,
          eventType: EVENT_TYPES.MEMBER_NAME_CHANGE,
          data: {
            description: `Никнейм участника изменен: ${newMember.user.tag}`,
            userId: newMember.user.id,
            fields
          }
        });

        return;
      }

    } catch (error) {
      logger.error('Ошибка в событии guildMemberUpdate:', error);
    }
  }
};
