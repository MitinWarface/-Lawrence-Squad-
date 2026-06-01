import { EmbedBuilder, ChannelType } from 'discord.js';
import { getGuildConfig } from '../services/guildConfig.js';
import { EVENT_TYPES } from '../services/loggingService.js';
import { logger } from './logger.js';

export async function logTicketEvent({ client, guildId, event }) {
  try {
    const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) {
      logger.warn(`logTicketEvent вызван без указания действительного сервера: ${guildId}`);
      return;
    }

    const config = await getGuildConfig(client, guildId);

    const logChannelId = getLogChannelForEventType(config, event.type);
    if (!logChannelId) {
      return;
    }

    const channel = guild.channels.cache.get(logChannelId) || await guild.channels.fetch(logChannelId).catch(() => null);
    if (!channel) {
      logger.warn(`Канал для логов тикетов не найден: ${logChannelId} (тип события: ${event.type})`);
      return;
    }

    const permissions = channel.permissionsFor(guild.members.me);
    if (!permissions.has(['SendMessages', 'EmbedLinks'])) {
      logger.warn(`Недостаточно прав в канале для логов тикетов: ${logChannelId}`);
      return;
    }

    const embed = await createTicketLogEmbed(guild, event);
    
    const messageOptions = { embeds: [embed] };
    
    if (event.attachments && event.attachments.length > 0) {
      messageOptions.files = event.attachments;
    }

    await channel.send(messageOptions);
    logger.info(`Событие тикета записано: ${event.type} на сервере ${guildId}`);

  } catch (error) {
    logger.error('Ошибка при логировании события тикета:', error);
  }
}

function getLogChannelForEventType(config, eventType) {
  switch (eventType) {
    case 'transcript':
      return config.ticketTranscriptChannelId || null;

    case 'open':
    case 'close':
    case 'delete':
    case 'claim':
    case 'unclaim':
    case 'priority':
      return config.ticketLogsChannelId || null;

    default:
      return null;
  }
}

function mapTicketEventType(eventType) {
  switch (eventType) {
    case 'open':
      return EVENT_TYPES.TICKET_CREATE;
    case 'close':
      return EVENT_TYPES.TICKET_CLOSE;
    case 'delete':
      return EVENT_TYPES.TICKET_DELETE;
    case 'claim':
    case 'unclaim':
      return EVENT_TYPES.TICKET_CLAIM;
    case 'priority':
      return EVENT_TYPES.TICKET_PRIORITY;
    case 'transcript':
      return EVENT_TYPES.TICKET_TRANSCRIPT;
    default:
      return null;
  }
}

async function createTicketLogEmbed(guild, event) {
  const embed = new EmbedBuilder();
  
  const eventColors = {
    open: 0x2ecc71,
    close: 0xe74c3c,
    delete: 0x8b0000,
    claim: 0x3498db,
    unclaim: 0xf39c12,
    priority: 0x9b59b6,
    transcript: 0x1abc9c
  };
  
  embed.setColor(eventColors[event.type] || 0x95a5a6);
  
  const eventInfo = getEventDisplayInfo(event);
  embed.setTitle(eventInfo.title);
  embed.setDescription(eventInfo.description);
  
  embed.setTimestamp();
  
  if (event.ticketId || event.ticketNumber) {
    embed.setFooter({ 
      text: `ID Тикета: ${event.ticketNumber || event.ticketId || 'Неизвестно'}` 
    });
  }
  
  const fields = [];
  
  if (event.userId) {
    try {
      const user = await guild.client.users.fetch(event.userId).catch(() => null);
      if (user) {
        fields.push({
          name: '👤 Пользователь',
          value: `${user.tag} (${event.userId})`,
          inline: true
        });
      }
    } catch (error) {
      fields.push({
        name: '👤 Пользователь',
        value: `<@${event.userId}> (${event.userId})`,
        inline: true
      });
    }
  }
  
  if (event.executorId) {
    try {
      const executor = await guild.client.users.fetch(event.executorId).catch(() => null);
      if (executor) {
        fields.push({
          name: '🔨 Исполнитель',
          value: `${executor.tag} (${event.executorId})`,
          inline: true
        });
      }
    } catch (error) {
      fields.push({
        name: '🔨 Исполнитель',
        value: `<@${event.executorId}> (${event.executorId})`,
        inline: true
      });
    }
  }
  
  if (event.reason) {
    fields.push({
      name: '📝 Причина',
      value: event.reason,
      inline: false
    });
  }
  
  if (event.priority) {
    const priorityEmojis = {
      none: '⚪',
      low: '🔵',
      medium: '🟢',
      high: '🟡',
      urgent: '🔴'
    };

    const priorityNames = {
      none: 'Отсутствует',
      low: 'Низкий',
      medium: 'Средний',
      high: 'Высокий',
      urgent: 'Срочный'
    };
    
    fields.push({
      name: '🎯 Приоритет',
      value: `${priorityEmojis[event.priority] || '⚪'} ${priorityNames[event.priority] || event.priority}`,
      inline: true
    });
  }
  
  if (event.metadata) {
    Object.entries(event.metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        fields.push({
          name: `📊 ${key.charAt(0).toUpperCase() + key.slice(1)}`,
          value: String(value),
          inline: true
        });
      }
    });
  }
  
  embed.addFields(fields);
  
  return embed;
}

function getEventDisplayInfo(event) {
  const ticketRef = event.ticketNumber ? `#${event.ticketNumber}` : event.ticketId ? `<#${event.ticketId}>` : 'Неизвест
