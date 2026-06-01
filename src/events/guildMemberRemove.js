import { Events, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getColor } from '../config/bot.js';
import { getWelcomeConfig, getUserApplications, deleteApplication } from '../utils/database.js';
import { formatWelcomeMessage } from '../utils/welcome.js';
import { logEvent, EVENT_TYPES } from '../services/loggingService.js';
import { getServerCounters, updateCounter } from '../services/serverstatsService.js';
import { getGuildBirthdays, deleteBirthday } from '../utils/database.js';
import { deleteUserLevelData } from '../services/leveling.js';
import { logger } from '../utils/logger.js';

export default {
  name: Events.GuildMemberRemove,
  once: false,
  
  async execute(member) {
    try {
        const { guild, user } = member;
        
        const welcomeConfig = await getWelcomeConfig(member.client, guild.id);
        
        const goodbyeChannelId = welcomeConfig?.goodbyeChannelId;

        if (welcomeConfig?.goodbyeEnabled && goodbyeChannelId) {
            const channel = guild.channels.cache.get(goodbyeChannelId);
            if (channel?.isTextBased?.()) {
                const me = guild.members.me;
                const permissions = me ? channel.permissionsFor(me) : null;
                if (!permissions?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
                    return;
                }

                const formatData = { user, guild, member };
                const goodbyeMessage = formatWelcomeMessage(
                    welcomeConfig.leaveMessage || welcomeConfig.leaveEmbed?.description || '{user.tag} покинул сервер.',
                    formatData
                );

                const embedTitle = formatWelcomeMessage(
                    welcomeConfig.leaveEmbed?.title || '👋 До свидания',
                    formatData
                );
                const embedFooter = welcomeConfig.leaveEmbed?.footer
                    ? formatWelcomeMessage(welcomeConfig.leaveEmbed.footer, formatData)
                    : `Прощание от сервера ${guild.name}!`;

                const canEmbed = permissions.has(PermissionFlagsBits.EmbedLinks);

                if (!canEmbed) {
                    await channel.send({
                        content: welcomeConfig?.goodbyePing ? `<@${user.id}> ${goodbyeMessage}` : goodbyeMessage,
                        allowedMentions: welcomeConfig?.goodbyePing ? { users: [user.id] } : { parse: [] }
                    });
                } else {
                    const embed = new EmbedBuilder()
                        .setTitle(embedTitle)
                        .setDescription(goodbyeMessage)
                        .setColor(welcomeConfig.leaveEmbed?.color || getColor('error'))
                        .setThumbnail(user.displayAvatarURL())
                        .addFields(
                            { name: 'Пользователь', value: `${user.tag} (${user.id})`, inline: true },
                            { name: 'Участников', value: guild.memberCount.toString(), inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: embedFooter });

                    if (typeof welcomeConfig.leaveEmbed?.image === 'string') {
                        embed.setImage(welcomeConfig.leaveEmbed.image);
                    } else if (welcomeConfig.leaveEmbed?.image?.url) {
                        embed.setImage(welcomeConfig.leaveEmbed.image.url);
                    }

                    await channel.send({
                        content: welcomeConfig?.goodbyePing ? `<@${user.id}>` : undefined,
                        allowedMentions: welcomeConfig?.goodbyePing ? { users: [user.id] } : { parse: [] },
                        embeds: [embed]
                    });
                }
            }
        }
        
        
        try {
            await logEvent({
                client: member.client,
                guildId: guild.id,
                eventType: EVENT_TYPES.MEMBER_LEAVE,
                data: {
                    description: `${user.tag} покинул сервер`,
                    userId: user.id,
                    fields: [
                        {
                            name: '👤 Участник',
                            value: `${user.tag} (${user.id})`,
                            inline: true
                        },
                        {
                            name: '👥 Участников на сервере',
                            value: guild.memberCount.toString(),
                            inline: true
                        },
                        {
                            name: '📅 Присоединился',
                            value: `<t:${Math.floor((member.joinedTimestamp || 0) / 1000)}:R>`,
                            inline: true
                        }
                    ]
                }
            });
        } catch (error) {
            logger.debug('Ошибка при записи в лог выхода участника:', error);
        }
        
        
        try {
            const counters = await getServerCounters(member.client, guild.id);
            for (const counter of counters) {
                if (counter && counter.type && counter.channelId && counter.enabled !== false) {
                    await updateCounter(member.client, guild, counter);
                }
            }
        } catch (error) {
            logger.debug('Ошибка при обновлении счетчиков при выходе участника:', error);
        }
        
        // Создание резервной копии и удаление данных о дне рождения при выходе участника
        try {
            const birthdays = await getGuildBirthdays(member.client, guild.id);
            if (birthdays[user.id]) {
                const backupKey = `guild:${guild.id}:birthdays:left`;
                const backup = (await member.client.db.get(backupKey)) || {};
                backup[user.id] = birthdays[user.id];
                await member.client.db.set(backupKey, backup);
                await deleteBirthday(member.client, guild.id, user.id);
                logger.debug(`День рождения сохранен в резервную копию и удален для пользователя ${user.id} на сервере ${guild.id}`);
            }
        } catch (error) {
            logger.debug('Ошибка при обработке дня рождения при выходе участника:', error);
        }
        
        // Удаление всех ожидающих заявок при выходе участника
        try {
            const userApplications = await getUserApplications(member.client, guild.id, user.id);
            if (userApplications && userApplications.length > 0) {
                for (const app of userApplications) {
                    await deleteApplication(member.client, guild.id, app.id, user.id);
                }
                logger.debug(`Удалено заявок: ${userApplications.length} для пользователя ${user.id} на сервере ${guild.id}`);
            }
        } catch (error) {
            logger.debug('Ошибка при обработке заявок при выходе участника:', error);
        }

        // Удаление данных об уровне при выходе участника
        try {
            await deleteUserLevelData(member.client, guild.id, user.id);
            logger.debug(`Удалены данные об уровне для пользователя ${user.id} на сервере ${guild.id}`);
        } catch (error) {
            logger.debug('Ошибка при обработке данных об уровне при выходе участника:', error);
        }
        
    } catch (error) {
        logger.error('Ошибка в событии guildMemberRemove:', error);
    }
  }
};
