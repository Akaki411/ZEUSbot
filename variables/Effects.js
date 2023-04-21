module.exports = {
    block_moving: {
        type: "block_moving",
        name: "🔗 Кандалы",
        time: 1440,
        description: "Блокирует перемещение между городами/фракциями"
    },
    block_transfer: {
        type: "block_transfer",
        name: "⛔ Блокировка счета",
        time: 1440,
        description: "Блокирует переводы ресурсов между игроком и другими игроками, городами, фракциями"
    },
    block_extracting: {
        type: "block_extracting",
        name: "😳 Усталость",
        time: 1440,
        description: "Блокирует добычу ресурсов"
    },
    bot_ignore: {
        type: "bot_ignore",
        name: "🤐 Проклятие игнора",
        time: 1440,
        description: "Бот полностью перестает воспринимать игрока, не считает актив в чатах, не отвечает на команды в чатах и не реагирует в ЛС"
    },
    luck: {
        type: "luck",
        name: "🍀 Удача",
        time: 720,
        description: "За одну добычу ресурса снимается 50% усталости вместо 100%"
    },
    industriousness: {
        type: "industriousness",
        name: "💪 Трудолюбие",
        time: 720,
        description: "В 2 раза увеличивает шанс добычи алмаза (0,01% -> 0,02%)"
    }
}