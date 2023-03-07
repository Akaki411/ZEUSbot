const {Keyboard} = require('vk-io')

class KeyboardButtons
{
    none = Keyboard.keyboard([])

    build = (buttons) => {
        return Keyboard.keyboard(buttons)
    }

    secondaryButton = (params) => {
        return Keyboard.textButton({
            label: params[0],
            color: Keyboard.SECONDARY_COLOR,
            payload: {
                choice: params[1]
            }
        })
    }

    cancelButton = Keyboard.textButton({
        label: '⛔ Отмена',
        color: Keyboard.NEGATIVE_COLOR,
        payload: {
            choice: 'cancel'
        }
    })

    backButton = Keyboard.textButton({
        label: '🔙 Назад',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'back'
        }
    })

    yesButton = Keyboard.textButton({
        label: '✅ Да',
        color: Keyboard.POSITIVE_COLOR,
        payload: {
            choice: 'yes'
        }
    })

    noButton = Keyboard.textButton({
        label: '❌ Нет',
        color: Keyboard.NEGATIVE_COLOR,
        payload: {
            choice: 'no'
        }
    })

    leftButton = Keyboard.textButton({
        label: '◀',
        color: Keyboard.PRIMARY_COLOR,
        payload: {
            choice: 'left'
        }
    })

    rightButton = Keyboard.textButton({
        label: '▶',
        color: Keyboard.PRIMARY_COLOR,
        payload: {
            choice: 'right'
        }
    })

    registrationButton = Keyboard.textButton({
        label: '🔰Зарегистрироваться',
        color: Keyboard.POSITIVE_COLOR,
        payload: {
            choice: 'registration'
        }
    })

    manButton = Keyboard.textButton({
        label: '♂ Мужчина',
        color: Keyboard.PRIMARY_COLOR,
        payload: {
            choice: 'man'
        }
    })

    womanButton = Keyboard.textButton({
        label: '♀ Женщина',
        color: Keyboard.NEGATIVE_COLOR,
        payload: {
            choice: 'woman'
        }
    })

    romanButton = Keyboard.textButton({
        label: 'Римлянин 🔱',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'rim'
        }
    })

    celtButton = Keyboard.textButton({
        label: 'Кельт 🍀',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'celt'
        }
    })

    greekButton = Keyboard.textButton({
        label: 'Грек 🏛️',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'greek'
        }
    })

    armenianButton = Keyboard.textButton({
        label: 'Армянин 💃',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'armenian'
        }
    })

    persianButton = Keyboard.textButton({
        label: 'Перс 🐘',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'persian'
        }
    })

    germanButton = Keyboard.textButton({
        label: 'Германец ⚔',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'german'
        }
    })

    adminPanelButton = Keyboard.textButton({
        label: '🎚 Админка',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'admin'
        }
    })

    menuButton = Keyboard.textButton({
        label: '🚩 Меню',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'menu'
        }
    })

    GMMenuButton = Keyboard.textButton({
        label: '✨ ГМ-панель',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'gm_menu'
        }
    })

    mayorMenuButton = Keyboard.textButton({
        label: '🏙 Управление городом',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'mayor_menu'
        }
    })

    leaderMenuButton = Keyboard.textButton({
        label: '👑 Управление государством',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'leader_menu'
        }
    })

    giveRoleButton = Keyboard.textButton({
        label: '⤵ Назначить роль',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'give_role'
        }
    })

    controlsButton = Keyboard.textButton({
        label: '🎛 Управление',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'controls'
        }
    })

    sqlButton = Keyboard.textButton({
        label: '💭 SQL',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'sql'
        }
    })

    statsButton = Keyboard.textButton({
        label: '📈 Статистика',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'stats'
        }
    })


    playerButton = Keyboard.textButton({
        label: '👶 Игрок',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'player'
        }
    })

    moderatorButton = Keyboard.textButton({
        label: '🧒 Модератор',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'moder'
        }
    })

    GMButton = Keyboard.textButton({
        label: '🧑 Гейм-мастер',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'GM'
        }
    })

    adminButton = Keyboard.textButton({
        label: '👨‍🦳 Админ',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'admin'
        }
    })

    supportButton = Keyboard.textButton({
        label: '🔧 Тех-поддержка',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'support'
        }
    })

    projectHeadButton = Keyboard.textButton({
        label: '🤴 Глава проекта',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'project_head'
        }
    })

    createCountryButton = Keyboard.textButton({
        label: '➕ Создать фракцию',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'create_country'
        }
    })

    appointLeaderCountryButton = Keyboard.textButton({
        label: '🫅 Назначить правителя',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'appoint_leader'
        }
    })

    woodButton = Keyboard.textButton({
        label: '🪵 Дерево',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'wood'
        }
    })

    stoneButton = Keyboard.textButton({
        label: '🪨 Камень',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'stone'
        }
    })

    ironButton = Keyboard.textButton({
        label: '🌑 Железо',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'iron'
        }
    })

    copperButton = Keyboard.textButton({
        label: '🪙 Бронза',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'copper'
        }
    })

    silverButton = Keyboard.textButton({
        label: '🥈 Серебро',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'silver'
        }
    })

    todayStatsButton = Keyboard.textButton({
        label: '📈 Статистика за сегодня',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'stats_today'
        }
    })

    dateStatsButton = Keyboard.textButton({
        label: '📈 Статистика за период',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'stats_date'
        }
    })

    warningsButton = Keyboard.textButton({
        label: '⚠ Предупреждения',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'warnings'
        }
    })

    bansButton = Keyboard.textButton({
        label: '💀 Баны',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'bans'
        }
    })

    effectsButton = Keyboard.textButton({
        label: '🔮 Эффекты',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'effects'
        }
    })

    profileButton = Keyboard.textButton({
        label: '📂 Профиль',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'profile'
        }
    })

    resourcesButton = Keyboard.textButton({
        label: '🛒 Ресурсы',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'resources'
        }
    })

    parametersButton = Keyboard.textButton({
        label: '⚙ Параметры',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'params'
        }
    })

    mapButton = Keyboard.textButton({
        label: '🌍 Карта',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'map'
        }
    })

    propertyButton = Keyboard.textButton({
        label: '🏠 Имущество',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'property'
        }
    })

    extractButton = Keyboard.textButton({
        label: '⛏ Добыча',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'extract'
        }
    })

    extractWheatButton = Keyboard.textButton({
        label: '🌾 Добывать зерно',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'extract_wheat'
        }
    })

    extractStoneButton = Keyboard.textButton({
        label: '⛏ Добывать камень',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'extract_stone'
        }
    })

    extractWoodButton = Keyboard.textButton({
        label: '🪓 Добывать дерево',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'extract_wood'
        }
    })


    extractIronButton = Keyboard.textButton({
        label: '⛏ Добывать железо',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'extract_iron'
        }
    })

    extractCopperButton = Keyboard.textButton({
        label: '⛏ Добывать бронзу',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'extract_copper'
        }
    })

    extractSilverButton = Keyboard.textButton({
        label: '⛏ Добывать серебро',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'extract_silver'
        }
    })

    ratingsButton = Keyboard.textButton({
        label: '🌟 Рейтинги',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'ratings'
        }
    })

    relaxButton = Keyboard.textButton({
        label: '💤 Отдохнуть',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'relax'
        }
    })

    chatListButton = Keyboard.textButton({
        label: '💬 Список чатов',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'chat_list'
        }
    })

    locationButton = Keyboard.textButton({
        label: '🌲 Локация',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'location'
        }
    })

    whereMeButton = Keyboard.textButton({
        label: '🧭 Где я?',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'where_me'
        }
    })

    buildingsButton = Keyboard.textButton({
        label: '🏘 Постройки',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'buildings'
        }
    })

    otherCity = Keyboard.textButton({
        label: '🔄 В другой город',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'other_city'
        }
    })

    otherCountry = Keyboard.textButton({
        label: '🔃 В другую фракцию',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'other_country'
        }
    })

    postboxButton = Keyboard.textButton({
        label: '📫 Почтовый ящик',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'postbox'
        }
    })

    getCitizenshipButton = Keyboard.textButton({
        label: '➕ Подать на гражданство',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'get_citizenship'
        }
    })

    refuseCitizenshipButton = Keyboard.textButton({
        label: '❌ Отказаться от гражданства',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'refuse_citizenship'
        }
    })

    merryButton = Keyboard.textButton({
        label: '💍 Вступить в брак',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'merry'
        }
    })

    refuseMerryButton = Keyboard.textButton({
        label: '💔 Подать на развод',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'refuse_merry'
        }
    })

    aboutMeButton = Keyboard.textButton({
        label: '💪 Обо мне',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'about_me'
        }
    })

    createLastWillButton = Keyboard.textButton({
        label: '✍ Написать завещание',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'create_last_will'
        }
    })

    deleteLastWillButton = Keyboard.textButton({
        label: '🗑 Удалить завещание',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'delete_last_will'
        }
    })

    newBuildingButton = Keyboard.textButton({
        label: '🗑 Новая постройка',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'new_building'
        }
    })

    deleteBuildingButton = Keyboard.textButton({
        label: '🗑 Снести постройку',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'delete_building'
        }
    })

    allBuildingsButton = Keyboard.textButton({
        label: '🗑 Список построек',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'all_buildings'
        }
    })

    wakeupButton = Keyboard.textButton({
        label: '☕ Проснуться',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'wakeup'
        }
    })

    //Callback buttons
    acceptCallbackButton = (obj) => {
        return Keyboard.callbackButton({
            label: 'Принять',
            color: Keyboard.PRIMARY_COLOR,
            payload: {
                command: obj.command,
                item: obj.item
            }
        })
    }

    declineCallbackButton = (obj) => {
        return Keyboard.callbackButton({
            label: 'Отклонить',
            color: Keyboard.NEGATIVE_COLOR,
            payload: {
                command: obj.command,
                item: obj.item
            }
        })
    }
}

module.exports = new KeyboardButtons()