const utility = {
    validatePayloadParameters(payload, params)
    {
        if(!payload)
        {
            payload = {};
        }

        for(let i = 0; i < params.length; i++)
        {
            if(!payload.hasOwnProperty(params[i].name))
            {
                return false;
            }

            if(typeof payload[params[i].name] != params[i].type)
            {
                return false;
            }
        }

        return true;
    },

    genId() {
        return 'id' + Math.floor(Math.random() * 10000000);
    }
}

module.exports = utility;