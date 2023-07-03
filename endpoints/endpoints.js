const ChatRPG = require('./../chat-rpg/chat-rpg');

//#region Utilities
function setStandardHeaders(res) {
    res.set('Access-Control-Allow-Origin', '*');
}

function validatePayloadParameters(payload, params)
{
    if(!payload) {
        payload = {};
    }

    for(let i = 0; i < params.length; i++) {
        if(!payload.hasOwnProperty(params[i].name)) {
            return false;
        }
        const type = typeof payload[params[i].name];
        if(typeof payload[params[i].name] != params[i].type || payload[params[i].name] == 'undefined') {
            return false;
        }
    }
    return true;
}

function internalErrorCatch(req, res, error) {
    let responce = {
        message: 'Internal Error',
        errorCode: 0
    };
    
    let status = 500;

    let errorCode = 1;
    for(rpgError in ChatRPG.Errors) {
        if(ChatRPG.Errors[rpgError] === error.message) {
            responce.errorCode = errorCode;
            responce.message = ChatRPG.Errors[rpgError];
            status = ChatRPG.Errors[rpgError].includes('not found') ? 404 : 400;
            break;
        }
        errorCode += 1;
    }

    console.error(error);
    sendResponceObject(res, responce, status);
}

function sendError(res, message = 'Bad rquest', rpgErrorCode = 1, errorCode = 400) {
    let responce = {
        message: message,
        errorCode: rpgErrorCode
    };
    sendResponceObject(res, responce, errorCode);
}

function sendResponceObject(res, message = {}, status = 200) {
    res.status(status);
    res.send(JSON.stringify(message));
}
//#endregion

//#region Endpoints
function welcome(req, res) {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200);
    res.send('Hello World!')
}

function get_starting_avatars(req, res, chatrpg) {
    setStandardHeaders(res);    
    chatrpg.getStartingAvatars().then((avatars) => {
        res.status(200);
        avatars = avatars ? avatars : [];
        res.send(JSON.stringify(avatars));
    })
    .catch((error) => {internalErrorCatch(req, res, error);});
}

function create_new_player_options(req, res) {
    setStandardHeaders(res);
    res.set('Access-Control-Allow-Methods', '*');
    res.set('Access-Control-Allow-Headers', '*');
    res.status(200);
    res.send('OK');
}

function create_new_player(req, res, chatrpg) {
    setStandardHeaders(res);
    let responce = {message: ''};

    const payloadParams = [
        {name: 'name', type: 'string'},
        {name: 'playerId', type: 'string'},
        {name: 'avatar', type: 'string'}
    ];
    
    if(!validatePayloadParameters(req.body, payloadParams))
    {
        res.status(400);
        responce.message = 'Data in payload malformed';
        responce.errorCode = 1;
        res.send(JSON.stringify(responce));
        return;
    }

    if(!req.query.hasOwnProperty('platform'))
    {
        res.status(400);
        responce.message = 'missing query string "platform"';
        responce.errorCode = 2;
        res.send(JSON.stringify(responce));
        return;
    }

    chatrpg.addNewPlayer(req.body.name, req.body.avatar, req.body.playerId, req.query.platform)
    .then(playerId => {
            res.status(200);
            res.send(JSON.stringify({playerId: playerId}));
    }).catch(error => {
        if(error.message == ChatRPG.Errors.playerExists) {
            res.status(400);
            responce.message = "A player with the provided ID already exsists";
            responce.errorCode = 2;
            res.send(JSON.stringify(responce));
        }
        else {
            internalErrorCatch(req, res, error);
        }
    });
}

function get_player(req, res, chatrpg) {
    setStandardHeaders(res);
    let responce = {message: ''};
    
    const queryParams = [
        {name: 'playerId', type: 'string'}
    ];

    if(req.query.platform) {
        queryParams.push({name: 'platform', type: 'string'});
    }

    if(!validatePayloadParameters(req.query, queryParams))
    {
        res.status(400);
        responce.message = 'missing query string keys';
        responce.errorCode = 1;
        res.send(JSON.stringify(responce));
        return;
    }

    chatrpg.findPlayerById(req.query.playerId, req.query.platform)
    .then(player => {
        res.status(200);
        res.send(JSON.stringify(player));
    })
    .catch(error => {
        if(error.message == ChatRPG.Errors.playerNotFound) {
            res.status(400);
            responce.message = error.message;
            responce.errorCode = 2;
            res.send(JSON.stringify(responce));
        }
        else {
            internalErrorCatch(req, res, error);
        }
    });
}

function join_game(req, res, chatrpg) {
    setStandardHeaders(res);
    let responce = {message: ''};

    const queryParams = [
        {name: 'playerId', type: 'string'},
        {name: 'gameId', type: 'string'},
    ];
    
    if(!validatePayloadParameters(req.query, queryParams))
    {
        res.status(400);
        responce.message = 'missing query string keys';
        responce.errorCode = 1;
        res.send(JSON.stringify(responce));
        return;
    }

    chatrpg.joinGame(req.query.playerId, req.query.gameId)
    .then(gameState => {
        res.status(200);
        res.send(JSON.stringify(gameState));

    }, (error) => {internalErrorCatch(req, res, error);});
}

function get_game(req, res, chatrpg) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'gameId', type: 'string'}
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatrpg.getGame(req.query.gameId)
    .then(gameUpdate => {
        sendResponceObject(res, gameUpdate);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function start_battle(req, res, chatrpg) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'playerId', type: 'string'},
        {name: 'gameId', type: 'string'},
        {name: 'monsterId', type: 'string'}
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    if(req.body.hasOwnProperty('fallbackMonster')) {
        const fallbackMonsterParams = [
            {name: 'monsterClass', type: 'string'},
            {name: 'level', type: 'number'}
        ];

        if(!validatePayloadParameters(req.body.fallbackMonster, queryParams)) {
            sendError(res, "Fallback monster parameters are malformed");
            return;
        }
    }

    chatrpg.startBattle(req.query.playerId, req.query.gameId, req.query.monsterId, req.body.fallbackMonster)
    .then(battleState => {
        sendResponceObject(res, battleState);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function battle_action(req, res, chatrpg) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'battleId', type: 'string'},
        {name: 'actionType', type: 'string'}
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    const battleAction = {type: req.query.actionType};
    if(req.query.actionType === 'ability') {
        if(!validatePayloadParameters(req.query, {name: 'abilityName', type: 'string'})) {
            sendError(res, "Ability parameters are malformed");
            return;
        }
        battleAction.abilityName = req.query.abilityName;
    }

    if(req.query.actionType === 'item') {
        if(!validatePayloadParameters(req.query, {name: 'itemName', type: 'string'})) {
            sendError(res, "Item parameters are malformed");
            return;
        }
        battleAction.itemName = req.query.itemName;
    }

    chatrpg.battleAction(req.query.battleId, battleAction)
    .then(battleUpdate => {
        sendResponceObject(res, battleUpdate);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function equip_weapon(req, res, chatrpg) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'playerId', type: 'string'},
        {name: 'weaponId', type: 'string'}
    ]

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatrpg.equipWeapon(req.query.playerId, req.query.weaponId)
    .then(player => {
        sendResponceObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function drop_weapon(req, res, chatrpg) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'playerId', type: 'string'},
        {name: 'weaponId', type: 'string'}
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatrpg.dropWeapon(req.query.playerId, req.query.weaponId)
    .then(player => {
        sendResponceObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function equip_ability(req, res, chatrpg) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'playerId', type: 'string'},
        {name: 'abilityBookName', type: 'string'},
        {name: 'abilityIndex', type: 'string'},
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatrpg.equipAbility(req.query.playerId, req.query.abilityBookName, Number(req.query.abilityIndex), req.query.replacedAbilityName)
    .then(player => {
        sendResponceObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function drop_book(req, res, chatrpg) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'playerId', type: 'string'},
        {name: 'abilityBookName', type: 'string'}
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatrpg.dropBook(req.query.playerId, req.query.abilityBookName)
    .then(player => {
        sendResponceObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function drop_item(req, res, chatrpg) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'playerId', type: 'string'},
        {name: 'itemName', type: 'string'}
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatrpg.dropItem(req.query.playerId, req.query.itemName)
    .then(player => {
        sendResponceObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function get_shop(req, res, chatrpg) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'shopId', type: 'string'}
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatrpg.getShop(req.query.shopId)
    .then(shop => {
        sendResponceObject(res, shop);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function buy(req, res, chatrpg) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'playerId', type: 'string'},
        {name: 'shopId', type: 'string'},
        {name: 'productId', type: 'string'}
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatrpg.buy(req.query.playerId, req.query.shopId, req.query.productId)
    .then(player => {
        sendResponceObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}
//#endregion

module.exports = {
    welcome,
    get_starting_avatars,
    create_new_player_options,
    create_new_player,
    get_player,
    join_game,
    get_game,
    start_battle,
    battle_action,
    equip_weapon,
    drop_weapon,
    equip_ability,
    drop_book,
    drop_item,
    buy,
    get_shop
};