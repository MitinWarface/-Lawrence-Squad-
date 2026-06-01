import { 
    getJoinToCreateConfig, 
    removeJoinToCreateTrigger,
    unregisterTemporaryChannel,
    getTicketData,
    saveTicketData
} from '../utils/database.js';
import { getServerCounters, saveServerCounters } from '../services/serverstatsService.js';
import { logger } from '../utils/logger.js';

export default {
    name: 'channelDelete',
    async execute(channel, client) {
        // Обработка удаления текстового канала тикета
        if (channel.type === 0 && channel.guild) {
            try {
                const ticketData = await getTicketData(channel.guild.id, channel.id);
                if (ticketData && ticketData.status === 'open') {
                    ticketData.status = 'deleted';
                    ticketData.closedAt = new Date().toISOString();
                    await saveTicketData(channel.guild.id, channel.id, ticketData);
                    logger.info(`Канал тикета ${channel.id} был удален вручную на сервере ${channel.guild.id}, отмечен как удаленный`);
                }
            } catch (err) {
                logger.warn(`Не удалось очистить запись тикета для удаленного канала ${channel.id}:`, err);
            }
        }

        if (channel.type !== 2 && channel.type !== 4) {
            return;
        }

        const guildId = channel.guild.id;

        try {
            // Проверка, является ли этот канал каналом-счетчиком
            const counters = await getServerCounters(client, guildId);
            const orphanedCounter = counters.find(c => c.channelId === channel.id);
            
            if (orphanedCounter) {
                logger.info(`Канал-счетчик ${channel.name} (${channel.id}) был удален, удаление счетчика ${orphanedCounter.id} из базы данных`);
                
                const updatedCounters = counters.filter(c => c.channelId !== channel.id);
                const success = await saveServerCounters(client, guildId, updatedCounters);
                
                if (success) {
                    logger.info(`Успешно удален осиротевший счетчик ${orphanedCounter.id} (тип: ${orphanedCounter.type}) с сервера ${guildId}`);
                } else {
                    logger.warn(`Не удалось удалить осиротевший счетчик ${orphanedCounter.id} с сервера ${guildId}`);
                }
            }

            const config = await getJoinToCreateConfig(client, guildId);

            if (!config.enabled) {
                return;
            }

            if (config.triggerChannels.includes(channel.id)) {
                logger.info(`Триггер-канал "Join to Create" ${channel.name} (${channel.id}) был удален, удаление из конфигурации`);
                
                const success = await removeJoinToCreateTrigger(client, guildId, channel.id);
                if (success) {
                    logger.info(`Успешно удален триггер-канал ${channel.id} из конфигурации "Join to Create"`);
                } else {
                    logger.warn(`Не удалось удалить триггер-канал ${channel.id} из конфигурации "Join to Create"`);
                }
            }

            if (config.temporaryChannels[channel.id]) {
                logger.info(`Временный канал "Join to Create" ${channel.name} (${channel.id}) был удален, очистка базы данных`);
                
                const success = await unregisterTemporaryChannel(client, guildId, channel.id);
                if (success) {
                    logger.info(`Успешно очищен временный канал ${channel.id} из базы данных`);
                } else {
                    logger.warn(`Не удалось очистить временный канал ${channel.id} из базы данных`);
                }
            }

            if (config.categoryId === channel.id) {
                logger.warn(`Категория ${channel.name} (${channel.id}), используемая для временных каналов "Join to Create", была удалена. Функция "Join to Create" будет отключена.`);
                
                config.categoryId = null;
                config.enabled = false;
                
                try {
                    await client.db.set(`guild:${guildId}:jointocreate`, config);
                    logger.info(`Функция "Join to Create" отключена для сервера ${guildId} из-за удаления категории`);
                } catch (error) {
                    logger.error(`Не удалось отключить "Join to Create" для сервера ${guildId}:`, error);
                }
            }

        } catch (error) {
            logger.error(`Ошибка в событии channelDelete для сервера ${guildId}:`, error);
        }
    }
};
