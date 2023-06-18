module.exports = {
    censorship: /хуй|хуи|хуе|хуё|хуя|пизд|пезд|пёзд|ебл|ёбл|ёбел|ебел|еба|ебо|еби|ёба|ёбо|ёби|муд|блят|бляд|ганд|сук|суч|мраз/i,
    goodMusic: /phonk|фонк|dvrst|kaito|mick|geoff|rock|рок|saba|radio|аким|atomic|hotline|ramm|рам|король|киш/,
    badMusic: /oxxxy|окси|rap|реп/,
    registration: /^зарегистрироваться$|^регистрация$|^регестрация$|^зарегаться$/,
    clearKeyboard: /^убери клавиатуру|^убери кнопки|^у меня клавиатура на экране|^у меня кнопки на экране|^у меня кнопки в чате|^у меня клавиатура в чате/,
    badJoke: /^анекдот|^свиней|^требуем анекдот|^бот,? пошути|^пошути|^бот,? давай анекдот|^неси свиней|^дементий,? неси свиней|^дементий,? тащи свиней|^народ требует свиней|^расскажи анекдот|^шутк. в студию|^еще шутк/,
    warning: /^предупреждение$|^репорт$|^выдать варн$|^жалоба$|^пожаловаться$/,
    ban: /^глобан|^выдать бан|^забанить|^это бан/,
    resources: /^ресы|^ресурсы|^кошель|^кошелек|^мои ресурсы|^инвентарь|^мой инвентарь|^карман|^что у меня в кармане/,
    location: /^где я$|^компас$|^локация$/,
    aboutMe: /^обо мне$|^кто я$|^хто я$|^профиль$/,
    checkLocation: /^мы рядом$|^проверить местопположение$|^следить$/,
    checkDocs: /^проверить гражданство|^проверить документы|^кто ты|^ты кто|^хто ты|^ты хто|^представься|^представьтесь/,
    send: /^отправить |^угостить |^передать |^перевести |^отдать |^переслать |^дать |^поделиться /,
    money: /денег|деняк|деньг|монет/,
    wheat: /пшениц|пшен|зерн|зёрн/,
    stone: /камен|камн|булыж|камушек|камешков|камушков|камешек/,
    wood: /дерев|бревн|бревен|брёвен|деревяш/,
    iron: /желез/,
    copper: /бронз/,
    silver: /серебро|серебра|серебром/,
    diamond: /алмаз/,
    carrot: /морков|марков/,
    tea: /чай|чая|чаю|чайк|чаё|чае/,
    beer: /пиво|пива|пивк/,
    ale: /эль|элем|эля/,
    mushroom: /мухомор|мухомором|мухоморам/,
    vine: /вино|вина/,
    elephant: /слон/,
    dick: /хуй|хуе|хуё|хуи|писю|пись|писк|член|пенис/,
    relax: /^отдохнуть|^спать|^лечь спать|^отдых|^проснуться|^взбодриться|^хватит спать/,
    map: /^карта дорог$|^карта$|^дороги$/,
    work: /^работать$|^работа$|^добывать$|^чем заняться|^чем мне заняться/,
    countriesActive: /^актб|^актив/,
    countries: /^фракции|^список фракций|^страны|^государства/,
    events: /^сводка|^новости|^события|^что происходит/,
    info: /^инфо|^инфа|^информация/,
    marry: /^жениться$|^отдать свое сердце$|^передать сердце$|^предложить брак$|^брак$/,
    divorce: /^развод$|^развестись$|^подать на развод$|^вырвать сердце$/,
    stats: /^статистика$|^стата$/,
    getCitizenship: /^принять гражданство |^подать на гражданство |^подать гражданство |^стать правоверным /,
    toStall: /^стойло|^в стойло|^отправить в стойло|^ты отправляешься в стойло|^сам в стойло|^сама в стойло/,
    teleport: /^тп |^телепортировать/,
    changeNick: /^!nick |^!ник |^изменить ник |^поменять ник |^сменить ник /i,
    changeDescription: /^!description |^!описание |^изменить описание |^поменять описание |^сменить описание /i,
    cheating: /^накрутить |^накрутка /,
    pickUp: /^забрать |^отобрать |^скрутить /,
    dub: /^дублировать|^повторять|^повторение|^антимут/,
    stopDub: /^перестать дублировать|^хватит дублировать|^закончить дублировать|^не дублировать|^перестать повтор|^хватит повтор|^закончить повтор|^не повтор/,
    top: /^топы?$/,
    warnings: /^варны|^список варнов|^репорты|^список репортов|^жалобы|^список жалоб/,
    extract: /^добыть|^добывать|^добыча|^собрать|^собирать/,
    refuseCitizenship: /^отказаться от гражданства/,
    unregistered: /^кто не зарегистрирован|^не зарегистрирован|^не зареган/,
    delete: /^удалить|^-смс|^удоли/,
    mute: /^мут|^замутить|^молчи|^заткнись/,
    unmute: /^размут|^говори/,
    ignore: /^игнор/,
    sword: /^не матерись|^цензур/i,
    trolling: /^\+семпл|^семпл|^\+фраза|^фраза/i,
    stopTrolling: /^перестать троллить$|^не троллить$|^хватит$/i,
    botMem: /^бот,? запомни|^бот,? фраза|^бот,? повторяй/i,
    botForgot: /^бот,? забудь|^бот,? не повторяй/i,
    whereYou: /^где ты|^местоположение/,
    getFromBudget: /^взять|^из бюджета/,
    budget: /^казна|^бюджет/,
    getChatLink: /^бот,? дай ссылку на чат|^ссылка на чат|^дай ссылку на чат/,
    getImarat: /^принять ислам|^я лев ислама и русского халифата|^принять христианство|^принять православие|^во имя отца,? и сына,? и святого духа.? аминь/,
    rules: /^правил|^закон|^статья/,
    globalKick: /^глокик$|^бан блять!$/
}