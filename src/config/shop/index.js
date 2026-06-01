import { shopItems, getItemById, getItemsByType, getItemPrice, validatePurchase } from './items.js';
import { botConfig } from '../bot.js';

const { currency } = botConfig.economy;

export const shopConfig = {
    name: 'Магазин TitanBot',
    currency: currency.name,
    currencyName: currency.name,
    currencyNamePlural: currency.namePlural || `${currency.name}s`,
    currencySymbol: currency.symbol || '💵',
    
    categories: [
        {
            id: 'consumables',
            name: 'Расходники',
            description: 'Предметы одноразового использования, дающие временные бонусы',
            icon: '🍯',
            itemTypes: ['consumable']
        },
        {
            id: 'upgrades',
            name: 'Улучшения',
            description: 'Постоянные улучшения, повышающие ваши способности',
            icon: '⚡',
            itemTypes: ['upgrade']
        },
        {
            id: 'tools',
            name: 'Инструменты',
            description: 'Снаряжение, помогающее эффективнее добывать ресурсы',
            icon: '⛏️',
            itemTypes: ['tool']
        },
        {
            id: 'roles',
            name: 'Роли',
            description: 'Особые роли с уникальными привилегиями',
            icon: '🎭',
            itemTypes: ['role']
        }
    ],
    
    transaction: {
        cooldown: 1000,
        maxQuantity: 10,
        confirmTimeout: 30000,
        
        refundPolicy: {
            enabled: true,
            window: 300000,
            fee: 0.1
        }
    },
    
    ui: {
        itemsPerPage: 5,
        showOutOfStock: true,
        showOwnedItems: true,
        showAffordability: true,
        
        colors: {
            primary: '#5865F2',
            success: '#43B581',
            error: '#F04747',
            warning: '#FAA61A',
            info: '#00B0F4',
            
            rarity: {
                common: '#99AAB5',
                uncommon: '#2ECC71',
                rare: '#3498DB',
                epic: '#9B59B6',
                legendary: '#F1C40F',
                mythic: '#E74C3C'
            }
        },
        
        emojis: {
            currency: '🪙',
            quantity: '✖️',
            price: '💵',
            owned: '✅',
            outOfStock: '❌',
            
            types: {
                consumable: '🍯',
                upgrade: '⚡',
                tool: '⛏️',
                role: '🎭'
            }
        }
    },
    
    events: {
        restock: {
            enabled: true,
            interval: 86400000,
            announcementChannel: null,
            message: '🛒 **Ассортимент магазина обновлен!** Доступны новые предметы!'
        },
        
        sales: {
            enabled: true,
            schedule: [
                {
                    day: 0,
                    discount: 0.2,
                    message: '🔥 **Скидки на выходных!** Скидка 20% на все товары!'
                },
            ]
        }
    }
};

export {
    shopItems,
    getItemById,
    getItemsByType,
    getItemPrice,
    validatePurchase
};

export function getCurrentPrice(itemId, { quantity = 1, userData = null } = {}) {
    const basePrice = getItemPrice(itemId) * quantity;
    
    let discount = 0;
    
    const now = new Date();
    if (shopConfig.events.sales.enabled) {
        const today = now.getDay();
        const sale = shopConfig.events.sales.schedule.find(s => s.day === today);
        if (sale) {
            discount += sale.discount;
        }
    }
    
    if (userData) {
        if (userData.roles?.includes('premium')) {
            discount += 0.1;
        }
        
        if (quantity >= 10) {
            discount += 0.1;
        }
    }
    
    discount = Math.max(0, Math.min(1, discount));
    
    return Math.floor(basePrice * (1 - discount));
}

export function getCategoryForItem(itemType) {
    return shopConfig.categories.find(cat => 
        cat.itemTypes.includes(itemType)
    ) || {
        id: 'other',
        name: 'Другое',
        description: 'Разные предметы',
        icon: '📦'
    };
}

export function getItemsInCategory(categoryId) {
    const category = shopConfig.categories.find(cat => cat.id === categoryId);
    if (!category) return [];
    
    return shopItems.filter(item => 
        category.itemTypes.includes(item.type)
    );
}
