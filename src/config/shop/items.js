export const shopItems = [
    {
        id: 'extra_work',
        name: 'Дополнительная рабочая смена',
        price: 5000,
        description: 'Позволяет использовать команду `/work` еще 1 раз.',
        type: 'consumable',
        maxQuantity: 5,
        cooldown: 86400000,
        effect: {
            type: 'command_boost',
            command: 'work',
            uses: 1
        }
    },
    {
        id: 'bank_upgrade_1',
        name: 'Улучшение банка I',
        price: 15000,
        description: 'Увеличивает вместимость банка и позволяет хранить больше средств.',
        type: 'upgrade',
        maxLevel: 5,
        effect: {
            type: 'bank_capacity',
            multiplier: 1.5
        }
    },
    {
        id: 'diamond_pickaxe',
        name: 'Алмазная кирка',
        price: 50000,
        description: 'Увеличивает добычу от команды `/mine`.',
        type: 'tool',
        durability: 100,
        effect: {
            type: 'mining_yield',
            multiplier: 2.0
        }
    },
    {
        id: 'premium_role',
        name: 'Премиум-роль на сервере',
        price: 15000,
        description: 'Особая роль, дающая красивый цвет и ежедневный бонус 10%.',
        type: 'role',
        roleId: null,
        effect: {
            type: 'daily_bonus',
            multiplier: 1.1
        }
    },
    {
        id: 'lucky_clover',
        name: 'Клевер удачи',
        price: 10000,
        description: 'Единожды увеличивает шанс на более крупный выигрыш в `/gamble`.',
        type: 'consumable',
        maxQuantity: 10,
        effect: {
            type: 'gamble_boost',
            multiplier: 1.5,
            uses: 1
        }
    },
    {
        id: 'fishing_rod',
        name: '🎣 Удочка',
        price: 5000,
        description: 'Используется для команд рыбалки.',
        type: 'tool',
        durability: 100,
        effect: {
            type: 'fishing_yield',
            multiplier: 1.0
        }
    },
    {
        id: 'pickaxe',
        name: '⛏️ Кирка',
        price: 7500,
        description: 'Используется для команд добычи ресурсов.',
        type: 'tool',
        durability: 100,
        effect: {
            type: 'mining_yield',
            multiplier: 1.2
        }
    },
    {
        id: 'laptop',
        name: '💻 Ноутбук',
        price: 15000,
        description: 'Увеличивает заработок от работы.',
        type: 'tool',
        durability: 200,
        effect: {
            type: 'work_yield',
            multiplier: 1.5
        }
    },
    {
        id: 'lucky_charm',
        name: '🍀 Талисман удачи',
        price: 10000,
        description: 'Увеличивает удачу в азартных играх. Хватает на 3 использования до исчезновения.',
        type: 'consumable',
        maxQuantity: 10,
        effect: {
            type: 'gamble_boost',
            multiplier: 1.3,
            uses: 3
        }
    },
    {
        id: 'bank_note',
        name: '📜 Банкнота',
        price: 25000,
        description: 'Увеличивает вместимость банка на 10 000. Можно покупать несколько раз.',
        type: 'tool',
        durability: null,
        effect: {
            type: 'bank_capacity',
            increase: 10000
        }
    },
    {
        id: 'personal_safe',
        name: '🔒 Личный сейф',
        price: 30000,
        description: 'Защищает ваши деньги от кражи. Не дает другим вас ограбить.',
        type: 'tool',
        durability: null,
        effect: {
            type: 'robbery_protection',
            protection: true
        }
    }
];

export function getItemById(itemId) {
    return shopItems.find(item => item.id === itemId);
}

export function getItemsByType(type) {
    return shopItems.filter(item => item.type === type);
}

export function getItemPrice(itemId) {
    const item = getItemById(itemId);
    return item ? item.price : 0;
}

export function validatePurchase(itemId, userData) {
    const item = getItemById(itemId);
    if (!item) {
        return { valid: false, reason: 'Предмет не найден' };
    }

    const inventory = userData.inventory || {};
    const upgrades = userData.upgrades || {};

    if (item.type === 'consumable' && item.maxQuantity) {
        const currentQuantity = inventory[itemId] || 0;
        if (currentQuantity >= item.maxQuantity) {
            return { 
                valid: false, 
                reason: `У вас может быть не более ${item.maxQuantity} шт. предмета "${item.name}"` 
            };
        }
    }

    if (item.type === 'upgrade' && item.maxLevel) {
        if (upgrades[itemId]) {
            return { 
                valid: false, 
                reason: `Вы уже купили "${item.name}"` 
            };
        }
    }

    if (item.type === 'tool') {
        const currentQuantity = inventory[itemId] || 0;
        if (itemId !== 'bank_note' && currentQuantity > 0) {
            return { 
                valid: false, 
                reason: `У вас уже есть "${item.name}"` 
            };
        }
    }

    if (item.type === 'role' && item.roleId) {
        if (userData.roles?.includes(item.roleId)) {
            return { 
                valid: false, 
                reason: `У вас уже есть роль "${item.name}"` 
            };
        }
    }

    return { valid: true };
}
