const sequelize = require('./DataBase')
const {DataTypes} = require('sequelize')

//Характеристики игрока
const Player = sequelize.define("player", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    nick: {type: DataTypes.STRING, unique: true, allowNull: false},
    gender: {type: DataTypes.BOOLEAN, allowNull: false},
    isBanned: {type: DataTypes.BOOLEAN, defaultValue: false},
    warningScore: {type: DataTypes.INTEGER, defaultValue: 0},
    role: {type: DataTypes.STRING, allowNull: false, defaultValue: "player"},
    status: {type: DataTypes.STRING, allowNull: false, defaultValue: "stateless"}
})
const PlayerStatus = sequelize.define("player-status", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    location: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    citizenship: {type: DataTypes.INTEGER,  allowNull: true}
})
const PlayerInfo = sequelize.define("player-info", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    description: {type: DataTypes.TEXT, allowNull: false},
    marriedID: {type: DataTypes.INTEGER, unique: true, allowNull: true, defaultValue: null},
    nationality: {type: DataTypes.STRING, allowNull: false},
    age: {type: DataTypes.INTEGER, allowNull: false},
    registration: {type: DataTypes.INTEGER, allowNull: true, defaultValue: null}
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
const OfficialInfo = sequelize.define("official-info", {
    id: {type: DataTypes.INTEGER, unique: true, allowNull: false, primaryKey: true},
    type: {type: DataTypes.STRING, allowNull: false},
    authority: {type: DataTypes.TEXT, allowNull: false}
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
    photoURL: {type: DataTypes.STRING, unique: false, allowNull: true},
    welcomePhotoURL: {type: DataTypes.STRING, unique: false, allowNull: true},
    leaderID: {type: DataTypes.INTEGER, unique: false, allowNull: true},
    parliamentID: {type: DataTypes.INTEGER, unique: true, allowNull: true},
    population: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    governmentForm: {type: DataTypes.STRING, allowNull: false, defaultValue: "Монархия"},
    resources: {type: DataTypes.STRING, allowNull: false},
    churchScore: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    capitalID: {type: DataTypes.INTEGER, unique: true, allowNull: false}
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

const CountryRoads = sequelize.define("country-roads", {
    countryID: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
    destinationID : {type: DataTypes.INTEGER, allowNull: false},
    isBlocked: {type: DataTypes.BOOLEAN, defaultValue: false},
    time: {type: DataTypes.INTEGER, defaultValue: 21600}
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
    isCapital: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false}
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

//Строения
const Buildings = sequelize.define("buildings", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    cityID: {type: DataTypes.INTEGER, allowNull: false},
    name: {type: DataTypes.STRING, allowNull: false},
    type: {type: DataTypes.STRING, allowNull: false},
    ownerID: {type: DataTypes.STRING, allowNull: false, defaultValue: "country"},
    level: {type: DataTypes.INTEGER, allowNull: false}
})

const Keys = sequelize.define("keys", {
    houseID: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
    ownerID: {type: DataTypes.INTEGER, allowNull: false},
    key: {type: DataTypes.STRING, allowNull: false},
    description: {type: DataTypes.STRING, allowNull: false}
})

//Предупреждения и баны
const Warning = sequelize.define("warnings", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    reason: {type: DataTypes.STRING, allowNull: false},
    explanation: {type: DataTypes.STRING, allowNull: true},
    proofImages: {type: DataTypes.STRING, allowNull: true}
})
const Ban = sequelize.define("ban", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    reason: {type: DataTypes.STRING, allowNull: false},
    explanation: {type: DataTypes.STRING, allowNull: true},
})

//Сбор статистики
const Stats = sequelize.define("stats", {
    messages: {type: DataTypes.INTEGER, allowNull: false},
    swearWordsLeader: {type: DataTypes.STRING, allowNull: false},
    mostActivity: {type: DataTypes.STRING, allowNull: false},
    stickerman: {type: DataTypes.STRING, allowNull: false},
    musician: {type: DataTypes.STRING, allowNull: false}
})

module.exports = {
    Player,
    PlayerStatus,
    PlayerInfo,
    PlayerResources,
    OfficialInfo,
    Country,
    CountryResources,
    CountryRoads,
    City,
    CityResources,
    Buildings,
    Warning,
    Ban,
    Keys,
    Stats,
    LastWills
}