/**
 * @import {Request, Response} from 'express'
 * @import {ChatRPG} from '../chat-rpg/chat-rpg'
 * @import {PlayerActionRequest} from '../chat-rpg/battle-system/battle-system'
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
 */
function validatePayloadParameters(payload, params)
{
    if(!payload) {
        payload = {};
    }

    for(let i = 0; i < params.length; i++) {
        const value = payload[params[i].name];
        if(value === undefined) {
            return false;
        }

        const type = typeof value;
        if(type != params[i].type) {
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
    let response = {
        message: 'Internal Error',
        errorCode: 0
    };
    
    let status = 500;

    let errorCode = 1;
    for(const rpgError in ChatRPGErrors) {
        if(ChatRPGErrors[rpgError] === error.message) {
            response.errorCode = errorCode;
            response.message = ChatRPGErrors[rpgError];
            status = ChatRPGErrors[rpgError].includes('not found') ? 404 : 400;
            break;
        }
        errorCode += 1;
    }

    console.error(error);
    sendResponseObject(res, response, status);
}

/**
 * 
 * @param {Response} res 
 * @param {string} message 
 * @param {number} rpgErrorCode 
 * @param {number} errorCode 
 */
function sendError(res, message = 'Bad request', rpgErrorCode = 1, errorCode = 400) {
    let response = {
        message: message,
        errorCode: rpgErrorCode
    };
    sendResponseObject(res, response, errorCode);
}

/**
 * 
 * @param {Response} res 
 * @param {object} message 
 * @param {number} status 
 */
function sendResponseObject(res, message = {}, status = 200) {
    res.status(status);
    res.send(JSON.stringify(message));
}

/**
 * 
 * @param {Response} res 
 * @param {object} message 
 * @param {number} status 
 */
function sendResponse(res, message = {}, status = 200) {
    setStandardHeaders(res);
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

function get_starting_avatars(req, res, chatRPG) {
    setStandardHeaders(res);
    chatRPG.getStartingAvatars().then((avatars) => {
        res.status(200);
        avatars = avatars ? avatars : [];
        res.send(JSON.stringify(avatars));
    })
    .catch((error) => {internalErrorCatch(req, res, error);});
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {ChatRPG} chatRPG 
 */
function get_game_info(req, res, chatRPG) {
    setStandardHeaders(res);
    chatRPG.getGameInfo().then((gameInfo) => {
        sendResponseObject(res, gameInfo);
    })
    .catch((error) => {internalErrorCatch(req, res, error);});
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {ChatRPG} chatRPG 
 */
function getGameGuide(req, res, chatRPG) {
    chatRPG.getGameGuide()
    .then((gameGuide) => {
        sendResponse(res, gameGuide);
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

function create_new_player(req, res, chatRPG) {
    setStandardHeaders(res);
    let response = {message: ''};

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
        response.message = 'Data in payload malformed';
        response.errorCode = 1;
        res.send(JSON.stringify(response));
        return;
    }

    if(!req.query.hasOwnProperty('platform'))
    {
        res.status(400);
        response.message = 'missing query string "platform"';
        response.errorCode = 2;
        res.send(JSON.stringify(response));
        return;
    }

    chatRPG.addNewPlayer(req.body.name, req.body.avatar, req.body.weaponType, req.body.vitalityBonus, req.body.playerId, req.query.platform)
    .then(player => {
            res.status(200);
            res.send(JSON.stringify(player));
    }).catch(error => {
        if(error.message === ChatRPGErrors.playerExists) {
            res.status(400);
            response.message = "A player with the provided ID already exists";
            response.errorCode = 2;
            res.send(JSON.stringify(response));
        }
        else {
            internalErrorCatch(req, res, error);
        }
    });
}

function get_player(req, res, chatRPG) {
    setStandardHeaders(res);
    let response = {message: ''};
    
    const queryParams = [
        {name: 'playerId', type: 'string'}
    ];

    if(req.query.platform) {
        queryParams.push({name: 'platform', type: 'string'});
    }

    if(!validatePayloadParameters(req.query, queryParams))
    {
        res.status(400);
        response.message = 'missing query string keys';
        response.errorCode = 1;
        res.send(JSON.stringify(response));
        return;
    }

    chatRPG.findPlayerById(req.query.playerId, req.query.platform)
    .then(player => {
        res.status(200);
        res.send(JSON.stringify(player));
    })
    .catch(error => {
        if(error.message == ChatRPGErrors.playerNotFound) {
            res.status(400);
            response.message = error.message;
            response.errorCode = 2;
            res.send(JSON.stringify(response));
        }
        else {
            internalErrorCatch(req, res, error);
        }
    });
}

function join_game(req, res, chatRPG) {
    setStandardHeaders(res);
    let response = {message: ''};

    const queryParams = [
        {name: 'playerId', type: 'string'},
        {name: 'gameId', type: 'string'},
    ];
    
    if(!validatePayloadParameters(req.query, queryParams))
    {
        res.status(400);
        response.message = 'missing query string keys';
        response.errorCode = 1;
        res.send(JSON.stringify(response));
        return;
    }

    chatRPG.joinGame(req.query.playerId, req.query.gameId)
    .then(gameState => {
        res.status(200);
        res.send(JSON.stringify(gameState));

    }, (error) => {internalErrorCatch(req, res, error);});
}

function get_game(req, res, chatRPG) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'gameId', type: 'string'},
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatRPG.getGame(req.query.gameId)
    .then(gameUpdate => {
        sendResponseObject(res, gameUpdate);
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

function start_battle(req, res, chatRPG) {
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

    chatRPG.startBattle(req.query.playerId, req.query.gameId, req.query.monsterId, req.body.fallbackMonster)
    .then(battleState => {
        sendResponseObject(res, battleState);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

/**
 * This endpoint is use to initiate an action in a battle
 * @param {Request} req 
 * @param {Response} res 
 * @param {ChatRPG} chatRPG 
 */
function battle_action(req, res, chatRPG) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'battleId', type: 'string'},
        {name: 'actionType', type: 'string'}
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    if(req.query.actionType != 'strike' &&
       req.query.actionType != 'strikeAbility' &&
       req.query.actionType != 'ability' &&
       req.query.actionType != 'item' &&
       req.query.actionType != 'escape'
    ) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    /**@type {PlayerActionRequest} */
    const battleAction = {type: req.query.actionType};
    if(req.query.actionType === 'ability') {
        if(!req.query.abilityName || typeof req.query.abilityName != 'string') {
            sendError(res, "Ability parameters are malformed");
            return;
        }
        battleAction.abilityName = req.query.abilityName;
    }

    if(req.query.actionType === 'item') {
        if(!req.query.itemId || typeof req.query.itemId != 'string') {
            sendError(res, "Item parameters are malformed");
            return;
        }
        battleAction.itemId = req.query.itemId;
    }

    // @ts-ignore
    chatRPG.battleAction(req.query.battleId, battleAction)
    .then(battleUpdate => {
        sendResponseObject(res, battleUpdate);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function equip_weapon(req, res, chatRPG) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'playerId', type: 'string'},
        {name: 'weaponId', type: 'string'}
    ]

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatRPG.equipWeapon(req.query.playerId, req.query.weaponId)
    .then(player => {
        sendResponseObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function drop_weapon(req, res, chatRPG) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'playerId', type: 'string'},
        {name: 'weaponId', type: 'string'}
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatRPG.dropWeapon(req.query.playerId, req.query.weaponId)
    .then(player => {
        sendResponseObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function equip_ability(req, res, chatRPG) {
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

    chatRPG.equipAbility(req.query.playerId, req.query.abilityBookId, Number(req.query.abilityIndex), req.query.replacedAbilityName)
    .then(player => {
        sendResponseObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function drop_book(req, res, chatRPG) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'playerId', type: 'string'},
        {name: 'abilityBookName', type: 'string'}
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatRPG.dropBook(req.query.playerId, req.query.abilityBookName)
    .then(player => {
        sendResponseObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function drop_item(req, res, chatRPG) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'playerId', type: 'string'},
        {name: 'itemName', type: 'string'}
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatRPG.dropItem(req.query.playerId, req.query.itemName)
    .then(player => {
        sendResponseObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function get_shop(req, res, chatRPG) {
    setStandardHeaders(res);

    const queryParams = [
        {name: 'shopId', type: 'string'}
    ];

    if(!validatePayloadParameters(req.query, queryParams)) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatRPG.getShop(req.query.shopId)
    .then(shop => {
        sendResponseObject(res, shop);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function buy(req, res, chatRPG) {
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

    chatRPG.buy(req.query.playerId, req.query.shopId, req.query.productId, amount)
    .then(player => {
        sendResponseObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function move_object_from_bag_to_inventory(req, res, chatRPG) {
    setStandardHeaders(res);

    if(!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'},
        {name: 'objectId', type: 'string'}
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatRPG.moveObjectFromBagToInventory(req.query.playerId, req.query.objectId)
    .then(player => {
        sendResponseObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function get_inventory_page(req, res, chatRPG) {
    setStandardHeaders(res);

    if(!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'},
        {name: 'pageId', type: 'string'}
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatRPG.getInventoryPage(req.query.playerId, req.query.pageId)
    .then(page => {
        sendResponseObject(res, page);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function move_object_from_inventory_to_bag(req, res, chatRPG) {
    setStandardHeaders(res);

    if(!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'},
        {name: 'pageId', type: 'string'},
        {name: 'objectId', type: 'string'},
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatRPG.moveObjectFromInventoryToBag(req.query.playerId, req.query.pageId, req.query.objectId)
    .then(moveResults => {
        sendResponseObject(res, moveResults);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function product_purchase(req, res, chatRPG, secret) {
    setStandardHeaders(res);
    if(!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'},
        {name: 'transactionReceipt', type: 'string'},
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }
    
    const receiptData = utility.verifyJWT(req.query.transactionReceipt, secret);
    if (typeof receiptData === 'string') {
        sendError(res, "Receipt verification failed");
        return;
    }

    chatRPG.productPurchase(req.query.playerId, receiptData.data.product.sku)
    .then(player => {
        sendResponseObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function claim_object(req, res, chatRPG) {
    setStandardHeaders(res);

    if(!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'},
        {name: 'objectId', type: 'string'},
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatRPG.claimObject(req.query.playerId, req.query.objectId)
    .then(player => {
        sendResponseObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

function updateGame(req, res, chatRPG) {
    setStandardHeaders(res);

    if(!validatePayloadParameters(req.query, [
        {name: 'gameId', type: 'string'},
        {name: 'mode', type: 'string'},
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    chatRPG.updateGame(req.query.gameId, req.query.mode)
    .then(player => {
        sendResponseObject(res, player);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {ChatRPG} chatRPG 
 */
function useItem(req, res, chatRPG) {
    setStandardHeaders(res);

    if (!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'},
        {name: 'objectId', type: 'string'}
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    // @ts-ignore
    chatRPG.useItem(req.query.playerId, req.query.objectId, req.body)
    .then(update => {
        sendResponseObject(res, update);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {ChatRPG} chatRPG 
 */
function resetAccount(req, res, chatRPG) {
    setStandardHeaders(res);

    if (!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'}
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    // @ts-ignore
    chatRPG.resetAccount(req.query.playerId)
    .then(update => {
        sendResponseObject(res, update);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {ChatRPG} chatRPG 
 */
function refreshDailyShop(req, res, chatRPG) {
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

    chatRPG.refreshDailyShop()
    .then(update => {
        sendResponseObject(res, {message: 'success!'});
    })
    .catch(error => internalErrorCatch(req, res, error));
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {ChatRPG} chatRPG 
 */
function sell(req, res, chatRPG) {
    setStandardHeaders(res);

    if (!validatePayloadParameters(req.query, [
        {name: 'playerId', type: 'string'},
        {name: 'objectId', type: 'string'},
        {name: 'shopId', type: 'string'},
    ])) {
        sendError(res, "Query parameters are malformed");
        return;
    }

    // @ts-ignore
    chatRPG.sell(req.query.playerId, req.query.objectId, req.query.shopId, req.body)
    .then(update => {
        sendResponseObject(res, update);
    })
    .catch(error => internalErrorCatch(req, res, error));
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {ChatRPG} chatRPG 
 */
function dailyOperations(req, res, chatRPG) {
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

    const promises = [];

    promises.push(chatRPG.createDailyReport());
    promises.push(chatRPG.refreshDailyShop());
    
    Promise.all(promises)
    .then(update => {
        sendResponseObject(res, {message: 'success!'});
    })
    .catch(error => internalErrorCatch(req, res, error));
}
//#endregion

module.exports = {
    welcome,
    default_options,
    get_starting_avatars,
    get_game_info,
    getGameGuide,
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
    refreshDailyShop,
    dailyOperations,
    sell
};