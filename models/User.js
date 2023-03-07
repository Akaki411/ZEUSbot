const SceneController = require("../controllers/SceneController")
const Data = require("./CacheData")
const keyboard = require("../variables/Keyboards")
class User
{
    constructor(user, status, info, resources)
    {

        this.id = user.dataValues.id
        this.nick = user.dataValues.nick
        this.gender = user.dataValues.gender ? "Мужчина" : "Женщина"
        this.warningScore = user.dataValues.warningScore
        this.role = user.dataValues.role
        this.status = user.dataValues.status
        this.location = status.dataValues.location
        this.citizenship = status.dataValues.citizenship
        this.marriedID = info.dataValues.marriedID
        this.nationality = info.dataValues.nationality
        this.age = info.dataValues.age
        this.registration = info.dataValues.registration
        this.fatigue = 95
        this.effects = []
        this.money = resources.dataValues.money
        this.stone = resources.dataValues.stone
        this.wood = resources.dataValues.wood
        this.wheat = resources.dataValues.wheat
        this.iron = resources.dataValues.iron
        this.copper = resources.dataValues.copper
        this.silver = resources.dataValues.silver
        this.diamond = resources.dataValues.diamond
        this.isMayor = false
        this.inBuild = null
        this.lastActionTime = new Date()
        this.timeout = null
        Data.cities.forEach(key => {
            if(key.leaderID === this.id)
            {
                this.isMayor = key.id
            }
        })
        this.state = (context) => {
            context.send(`⚠ У вас возникла проблема со сценой. Вы автоматически перенаправлены в главное меню.`,
                {
                    keyboard: SceneController.GetStartMenuKeyboard(context)
                })
            this.SetState(SceneController.StayInStartScreen)
        }
    }

    SetState(state)
    {
        this.state = state
    }
}

module.exports = User