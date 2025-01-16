/**
 * @import {Request, Response} from 'express'
 * @import ChatRPG from '../chat-rpg/chat-rpg'
 */

const ChatRPGErrors = require('../chat-rpg/errors');
const utility = require('../utility');

//#region Utilities
/**
 * 
 * @param {Response} res 
 */
function setStandardHeaders(res) {
    res.set('Access-Control-Allow-Origin', '*');
}

/**
 * 
 * @param {any} payload 
 * @param {{name: string, type: string}[]} params 
 * @returns 
 */
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

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {Error} error 
 */
function internalErrorCatch(req, res, error) {
    let responce = {
        message: 'Internal Error',
        errorCode: 0
    };
    
    let status = 500;

    let errorCode = 1;
    for(const rpgError in ChatRPGErrors) {
        if(ChatRPGErrors[rpgError] === error.message) {
            responce.errorCode = errorCode;
            responce.message = ChatRPGErrors[rpgError];
            status = ChatRPGErrors[rpgError].includes('not found') ? 404 : 400;
            break;
        }
        errorCode += 1;
    }

    console.error(error);
    sendResponceObject(res, responce, status);
}

/**
 * 
 * @param {Response} res 
 * @param {string} message 
 * @param {number} rpgErrorCode 
 * @param {number} errorCode 
 */
function sendError(res, message = 'Bad rquest', rpgErrorCode = 1, errorCode = 400) {
    let responce = {
        message: message,
        errorCode: rpgErrorCode
    };
    sendResponceObject(res, responce, errorCode);
}

/**
 * 
 * @param {Response} res 
 * @param {object} message 
 * @param {number} status 
 */
function sendResponceObject(res, message = {}, status = 200) {
    res.status(status);
    res.send(JSON.stringify(message));
}
//#endregion

//#region Endpoints
function welcome(req, res) {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200);
    res.send('Welcome to chat RPG!')
}

function default_options(req, res, next) {
    if(req.method !== 'OPTIONS') {
        next();
        return;
    }
    setStandardHeaders(res);
    res.set('Access-Control-Allow-Methods', '*');
    res.set('Access-Control-Allow-Headers', '*');
    res.status(200);
    res.send('OK');
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

function get_game_info(req, res, chatrpg) {
    setStandardHeaders(res);
    chatrpg.getGameInfo().then((gameInfo) => {
        sendResponceObject(res, gameInfo);
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
        {name: 'avatar', type: 'string'},
        {name: 'vitalityBonus', type: 'string'},
        {name: 'weaponType', type: 'string'}
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

    chatrpg.addNewPlayer(req.body.name, req.body.avatar, req.body.weaponType, req.body.vitalityBonus, req.body.playerId, req.query.platform)
    .then(player => {
            res.status(200);
            res.send(JSON.stringify(player));
    }).catch(error => {
        if(error.message === ChatRPGErrors.playerExists) {
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
        if(error.message == ChatRPGErrors.playerNotFound) {
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
        {name: 'gameId', type: 'string'},
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

function start_battle_options(req, res) {
    setStandardHeaders(res);
    //res.set('Access-Control-Allow-Methods', '*');
    res.set('Access-Control-Allow-Headers', '*');
    res.status(200);
    res.send('OK');
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

        if(!validatePayloadParameters(req.body.fallbackMonster, fallbackMonsterParams)) {
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
        if(!validatePayloadParameters(req.query, [
            {name: 'abilityName', type: 'string'}
        ])) {
            sendError(res, "Ability parameters are malformed");
            return;
        }
        battleAction.abilityName = req.query.abilityName;
    }

    if(req.query.actionType === 'item') {
        if(!validatePayloadParameters(req.query, [
            {name: 'itemId', type: 'string'}
        ])) {
            sendError(res, "Item parameters are malformed");
            return;
        }
        battleAction.itemId = req.query.itemId;
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
        {name: 'abilityBookId', type: 'string'},
        {name: 'abilityIndex', type: 'string'},
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatrpg.equipAbility(req.query.playerId, req.query.abilityBookId, Number(req.query.abilityIndex), req.query.replacedAbilityName)
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

    let amount = 1;
    if(validatePayloadParameters(req.query, [{name: 'amount', type: 'string'}])) {
        amount = Number(req.query.amount);
    }

    chatrpg.buy(req.query.playerId, req.query.shopId, req.query.productId, amount)
    .then(player => {
        sendResponceObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function move_object_from_bag_to_inventory(req, res, chatrpg) {
    setStandardHeaders(res);

    if(!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'},
        {name: 'objectId', type: 'string'}
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatrpg.moveObjectFromBagToInventory(req.query.playerId, req.query.objectId)
    .then(player => {
        sendResponceObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function get_inventory_page(req, res, chatrpg) {
    setStandardHeaders(res);

    if(!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'},
        {name: 'pageId', type: 'string'}
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatrpg.getInventoryPage(req.query.playerId, req.query.pageId)
    .then(page => {
        sendResponceObject(res, page);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function move_object_from_inventory_to_bag(req, res, chatrpg) {
    setStandardHeaders(res);

    if(!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'},
        {name: 'pageId', type: 'string'},
        {name: 'objectId', type: 'string'},
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatrpg.moveObjectFromInventoryToBag(req.query.playerId, req.query.pageId, req.query.objectId)
    .then(moveResults => {
        sendResponceObject(res, moveResults);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function product_purchase(req, res, chatrpg, secret) {
    setStandardHeaders(res);
    if(!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'},
        {name: 'transactionReceipt', type: 'string'},
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }
    
    const receiptData = utility.verifyJWT(req.query.transactionReceipt, secret);

    chatrpg.productPurchase(req.query.playerId, receiptData.data.product.sku)
    .then(player => {
        sendResponceObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function claim_object(req, res, chatrpg) {
    setStandardHeaders(res);

    if(!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'},
        {name: 'objectId', type: 'string'},
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatrpg.claimObject(req.query.playerId, req.query.objectId)
    .then(player => {
        sendResponceObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function updateGame(req, res, chatrpg) {
    setStandardHeaders(res);

    if(!validatePayloadParameters(req.query, [
        {name: 'gameId', type: 'string'},
        {name: 'mode', type: 'string'},
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatrpg.updateGame(req.query.gameId, req.query.mode)
    .then(player => {
        sendResponceObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {ChatRPG} chatrpg 
 */
function useItem(req, res, chatrpg) {
    setStandardHeaders(res);

    if (!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'},
        {name: 'objectId', type: 'string'}
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    // @ts-ignore
    chatrpg.useItem(req.query.playerId, req.query.objectId, req.body)
    .then(update => {
        sendResponceObject(res, update);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {ChatRPG} chatrpg 
 */
function resetAccount(req, res, chatrpg) {
    setStandardHeaders(res);

    if (!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'}
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    // @ts-ignore
    chatrpg.resetAccount(req.query.playerId)
    .then(update => {
        sendResponceObject(res, update);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {ChatRPG} chatrpg 
 */
function refreshDailyShop(req, res, chatrpg) {
    setStandardHeaders(res);

    if (!validatePayloadParameters(req.query, [
        {name: 'pwd', type: 'string'}
    ])) {
        sendError(res, "Missing Password");
        return;
    }

    if (req.query.pwd != "change_me") {
        sendError(res, "Wrong password");
        return;
    }

    chatrpg.refreshDailyShop()
    .then(update => {
        sendResponceObject(res, {message: 'success!'})
    })
    .catch(error => internalErrorCatch(req, res, error));
}
//#endregion

module.exports = {
    welcome,
    default_options,
    get_starting_avatars,
    get_game_info,
    create_new_player_options,
    create_new_player,
    get_player,
    join_game,
    get_game,
    start_battle_options,
    start_battle,
    battle_action,
    equip_weapon,
    drop_weapon,
    equip_ability,
    drop_book,
    drop_item,
    buy,
    move_object_from_bag_to_inventory,
    get_shop,
    get_inventory_page,
    move_object_from_inventory_to_bag,
    product_purchase,
    claim_object,
    updateGame,
    useItem,
    resetAccount,
    refreshDailyShop
};