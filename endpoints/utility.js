import { v4 as uuidv4 } from 'uuid';

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
    }
}

module.exports = utility;