const sequelize = require('./DataBase')
const {DataTypes} = require('sequelize')

//Характеристики игрока
const Player = sequelize.define("player", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    nick: {type: DataTypes.STRING, unique: false, allowNull: false},
    gender: {type: DataTypes.BOOLEAN, allowNull: false},
    isBanned: {type: DataTypes.BOOLEAN, defaultValue: false},
    warningScore: {type: DataTypes.INTEGER, defaultValue: 0},
    role: {type: DataTypes.STRING, allowNull: false, defaultValue: "player"},
    status: {type: DataTypes.STRING, allowNull: false, defaultValue: "stateless"},
    platform: {type: DataTypes.STRING, allowNull: false, defaultValue: "ANDROID"},
    avatar: {type: DataTypes.STRING, unique: false, allowNull: true},
    beer: {type: DataTypes.REAL, defaultValue: 0.0}
})
const PlayerStatus = sequelize.define("player-status", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    location: {type: DataTypes.INTEGER, allowNull: false},
    countryID: {type: DataTypes.INTEGER, allowNull: false},
    citizenship: {type: DataTypes.INTEGER,  allowNull: true},
    registration: {type: DataTypes.INTEGER, allowNull: true, defaultValue: null},
    notifications: {type: DataTypes.BOOLEAN, defaultValue: true},
    isFreezing: {type: DataTypes.BOOLEAN, defaultValue: false},
    dodgeTaxScore: {type: DataTypes.INTEGER, defaultValue: 0},
    botForgotTime: {type: DataTypes.DATE, defaultValue: sequelize.fn("now")},
    botCallTime: {type: DataTypes.DATE, defaultValue: sequelize.fn("now")},
    lastCitizenship: {type: DataTypes.DATE, defaultValue: sequelize.fn("now")}
})
const PlayerInfo = sequelize.define("player-info", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    description: {type: DataTypes.TEXT, allowNull: false},
    marriedID: {type: DataTypes.INTEGER, unique: true, allowNull: true, defaultValue: null},
    nationality: {type: DataTypes.STRING, allowNull: false},
    age: {type: DataTypes.INTEGER, allowNull: false},
    msgs: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    audios: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    stickers: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    swords: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    botMemory: {type: DataTypes.TEXT, allowNull: true}
})
const PlayerResources = sequelize.define("player-resources", {
    id: {type: DataTypes.INTEGER, unique: true, allowNull: false, primaryKey: true},
    money: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 100},
    stone: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    wood: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    wheat: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    iron: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    copper: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    silver: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    diamond: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0}
})

const Transactions = sequelize.define("player-transactions", {
    id: {type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true},
    fromID: {type: DataTypes.INTEGER, allowNull: false},
    toID: {type: DataTypes.INTEGER, allowNull: false},
    type: {type: DataTypes.STRING, allowNull: false},
    money: {type: DataTypes.INTEGER, allowNull: true},
    stone: {type: DataTypes.INTEGER, allowNull: true},
    wood: {type: DataTypes.INTEGER, allowNull: true},
    wheat: {type: DataTypes.INTEGER, allowNull: true},
    iron: {type: DataTypes.INTEGER, allowNull: true},
    copper: {type: DataTypes.INTEGER, allowNull: true},
    silver: {type: DataTypes.INTEGER, allowNull: true},
    diamond: {type: DataTypes.INTEGER, allowNull: true}
})
const PlayerNotes = sequelize.define("player-notes", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    playerID : {type: DataTypes.INTEGER, allowNull: false},
    note: {type: DataTypes.TEXT, allowNull: false}
})
const OfficialInfo = sequelize.define("official-info", {
    id: {type: DataTypes.INTEGER, unique: true, allowNull: false, primaryKey: true},
    countryID: {type: DataTypes.INTEGER, allowNull: false},
    nick: {type: DataTypes.STRING, allowNull: false},
    canBeDelegate: {type: DataTypes.BOOLEAN, defaultValue: false},
    canBuildCity: {type: DataTypes.BOOLEAN, defaultValue: false},
    canUseResources: {type: DataTypes.BOOLEAN, defaultValue: false},
    canUseArmy: {type: DataTypes.BOOLEAN, defaultValue: false},
    canAppointOfficial: {type: DataTypes.BOOLEAN, defaultValue: false},
    canAppointMayors: {type: DataTypes.BOOLEAN, defaultValue: false},
})
const LastWills = sequelize.define("last-wills", {
    userID: {type: DataTypes.INTEGER, unique: true, allowNull: false, primaryKey: true},
    text: {type: DataTypes.STRING, allowNull: false},
    successorID: {type: DataTypes.INTEGER, allowNull: false},
})

//Государства
const Country = sequelize.define("country", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    name: {type: DataTypes.STRING, unique: true, allowNull: false},
    description: {type: DataTypes.TEXT, unique: true, allowNull: false},
    groupID: {type: DataTypes.INTEGER, allowNull: false,},
    photoURL: {type: DataTypes.STRING, allowNull: true},
    map: {type: DataTypes.STRING, allowNull: true},
    welcomePhotoURL: {type: DataTypes.STRING, allowNull: true},
    leaderID: {type: DataTypes.INTEGER, allowNull: true},
    isParliament: {type: DataTypes.BOOLEAN, defaultValue: false},
    parliamentMembers: {type: DataTypes.STRING, allowNull: true},
    governmentForm: {type: DataTypes.STRING, allowNull: false, defaultValue: "Монархия"},
    resources: {type: DataTypes.STRING, allowNull: false},
    capitalID: {type: DataTypes.INTEGER, unique: true, allowNull: false},
    citizenTax: {type: DataTypes.INTEGER, defaultValue: 0},
    nonCitizenTax: {type: DataTypes.INTEGER, defaultValue: 0},
    tax: {type: DataTypes.INTEGER, defaultValue: 0},
    privateBuildingTax: {type: DataTypes.INTEGER, defaultValue: 0},
    entranceFee: {type: DataTypes.INTEGER, defaultValue: 0},
    isSiege: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    isUnderSanctions: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    notifications: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true},
    chatID: {type: DataTypes.STRING, allowNull: true, defaultValue: ""},
    warnings: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    rating: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    tags: {type: DataTypes.STRING, allowNull: true},
    tested: {type: DataTypes.BOOLEAN, defaultValue: false},
    barracksLevel: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 1},
    stability: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    peasantry: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    religion: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    aristocracy: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    military: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    merchants: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0}
})
const CountryResources = sequelize.define("country-resources", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    money: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    stone: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    wood: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    wheat: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    iron: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    copper: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    silver: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    diamond: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0}
})
const CountryArmy = sequelize.define("country-army", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true, autoIncrement: true},
    countryID: {type: DataTypes.INTEGER, allowNull: false},
    name: {type: DataTypes.STRING, allowNull: false},
    description: {type: DataTypes.STRING, allowNull: false, defaultValue: "Без описания"},
    tags: {type: DataTypes.STRING, allowNull: true},
    barracksLVL: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 1},
    type: {type: DataTypes.STRING, allowNull: false, defaultValue: "soldier"}
})

const CountryTaxes = sequelize.define("country-taxes", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    countryID: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
    toCountryID : {type: DataTypes.INTEGER, allowNull: false},
    tax: {type: DataTypes.INTEGER, defaultValue: 0}
})
const CountryRoads = sequelize.define("country-roads", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    fromID: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
    toID : {type: DataTypes.INTEGER, allowNull: false},
    isBlocked: {type: DataTypes.BOOLEAN, defaultValue: false},
    time: {type: DataTypes.INTEGER, defaultValue: 0}
})
const CountryNotes = sequelize.define("country-notes", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    countryID : {type: DataTypes.INTEGER, allowNull: false},
    note: {type: DataTypes.TEXT, allowNull: false}
})
const CountryUsingResources = sequelize.define("country-using-resources", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    json: {type: DataTypes.TEXT, allowNull: false},
    date: {type: DataTypes.DATE}
})
const CountryActive = sequelize.define("country-active", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    json: {type: DataTypes.TEXT, allowNull: false},
    date: {type: DataTypes.DATE}
})

//Города
const City = sequelize.define("city", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    countryID: {type: DataTypes.INTEGER, allowNull: true},
    leaderID: {type: DataTypes.INTEGER, allowNull: false},
    name: {type: DataTypes.STRING, allowNull: false, unique: true},
    description: {type: DataTypes.STRING, allowNull: false},
    photoURL: {type: DataTypes.STRING, allowNull: true},
    buildingsScore: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    maxBuildings: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 4},
    isSiege: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    isCapital: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    isUnderSanctions: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    notifications: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true}
})
const CityResources = sequelize.define("city-resources", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    money: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    stone: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    wood: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    wheat: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    iron: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    copper: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    silver: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    diamond: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0}
})
const CityRoads = sequelize.define("city-roads", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    fromID: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
    toID : {type: DataTypes.INTEGER, allowNull: false},
    isBlocked: {type: DataTypes.BOOLEAN, defaultValue: false},
    time: {type: DataTypes.INTEGER, defaultValue: 0}
})
const CityNotes = sequelize.define("city-notes", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    cityID : {type: DataTypes.INTEGER, allowNull: false},
    note: {type: DataTypes.TEXT, allowNull: false}
})

//Строения
const Buildings = sequelize.define("buildings", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    cityID: {type: DataTypes.INTEGER, allowNull: false},
    name: {type: DataTypes.STRING, allowNull: false},
    description: {type: DataTypes.TEXT, allowNull: true},
    type: {type: DataTypes.STRING, allowNull: false},
    ownerID: {type: DataTypes.INTEGER, allowNull: false},
    ownerType: {type: DataTypes.STRING, allowNull: false, defaultValue: "user"},
    level: {type: DataTypes.INTEGER, allowNull: false},
    freezing: {type: DataTypes.BOOLEAN, defaultValue: false}
})
const BuildingAddon = sequelize.define("building-addons", {
    id: {type: DataTypes.INTEGER, primaryKey: true},
    name: {type: DataTypes.STRING, allowNull: false},
    type: {type: DataTypes.STRING, allowNull: false}
})
const Keys = sequelize.define("keys", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    houseID: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
    ownerID: {type: DataTypes.INTEGER, allowNull: false},
    name: {type: DataTypes.STRING, allowNull: false}
})

//Предупреждения и баны
const Warning = sequelize.define("warnings", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    userID: {type: DataTypes.INTEGER, allowNull: false},
    reason: {type: DataTypes.STRING, allowNull: false},
    explanation: {type: DataTypes.STRING, allowNull: true},
    proofImage: {type: DataTypes.STRING, allowNull: true},
    time: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 90},
    banned: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    moderID: {type: DataTypes.INTEGER, allowNull: false}
})
const CountryWarning = sequelize.define("country-warnings", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    countryID: {type: DataTypes.INTEGER, allowNull: false},
    prohibit: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    time: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 21}
})
const Ban = sequelize.define("ban", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    userID: {type: DataTypes.INTEGER, allowNull: false},
    reason: {type: DataTypes.STRING, allowNull: false},
    explanation: {type: DataTypes.STRING, allowNull: true},
    prohibit: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    proofImage: {type: DataTypes.STRING, allowNull: true},
    moderID: {type: DataTypes.INTEGER, allowNull: false}
})
const Chats = sequelize.define("chats", {
    id: {type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true},
    countryID: {type: DataTypes.INTEGER, allowNull: false},
    link: {type: DataTypes.STRING, allowNull: false},
    name: {type: DataTypes.STRING, allowNull: false}
})
const Messages = sequelize.define("messages", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    text: {type: DataTypes.TEXT, allowNull: false},
    isSilent: {type: DataTypes.BOOLEAN, defaultValue: true}
})
const Events = sequelize.define("events", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    name: {type: DataTypes.STRING, allowNull: false},
    description: {type: DataTypes.TEXT, allowNull: false},
    date: {type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.fn('now')}
})


module.exports = {
    Player,
    PlayerStatus,
    PlayerInfo,
    PlayerResources,
    PlayerNotes,
    Transactions,
    OfficialInfo,
    Country,
    CountryResources,
    CountryRoads,
    CountryArmy,
    CountryTaxes,
    CountryUsingResources,
    CountryActive,
    CountryNotes,
    City,
    CityResources,
    CityRoads,
    CityNotes,
    Buildings,
    BuildingAddon,
    Warning,
    CountryWarning,
    Ban,
    Keys,
    LastWills,
    Chats,
    Messages,
    Events
}