import { Events } from "discord.js";
import { logger, startupLog } from "../utils/logger.js";
import config from "../config/application.js";
import { reconcileReactionRoleMessages } from "../services/reactionRoleService.js";

export default {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    try {
      client.user.setPresence(config.bot.presence);

      startupLog(`Готово! Выполнен вход как ${client.user.tag}`);
      startupLog(`Обслуживается серверов: ${client.guilds.cache.size}`);
      startupLog(`Загружено команд: ${client.commands.size}`);

      const reconciliationSummary = await reconcileReactionRoleMessages(client);
      startupLog(
        `Сверка ролей по реакциям: просканировано ${reconciliationSummary.scannedMessages}, удалено ${reconciliationSummary.removedMessages}, ошибок ${reconciliationSummary.errors}`
      );
    } catch (error) {
      logger.error("Ошибка в событии ready:", error);
    }
  },
};
