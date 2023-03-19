class Effect
{
    constructor(type, time)
    {
        this.type = type
        this.time = new Date()
        this.time.setDate(time.getMinutes() + time)
    }

    isValid()
    {
        const date = new Date()
        return (this.time - date > 0)
    }
}

module.exports = Effect