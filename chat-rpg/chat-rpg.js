const Schema = require("./datasource-schema");
const GameModes = require("./game-modes");

class ChatRPG {
    #datasource;
    
    static Platforms = {
        Twitch: 'twitch'
    }

    static Errors = {
        playerExists: 'player exists',
        playerNotFound: 'player not found'
    }

    constructor(datasource) {
        this.#datasource = datasource;
    }

    async getStartingAvatars() {
        const avatars = await this.#datasource.collection(Schema.Collections.Avatars).doc(Schema.AvatarDocuments.StartingAvatars).get();
        return avatars.data()[Schema.AvatarFields.Content];
    }

    async addNewPlayer(name, avatar, platformId, platform) {
        const player = {
            name: name,
            avatar: avatar,
            level: 1,
            attack: 1,
            magic_attack: 1,
            defence: 1,
            health: 10
        }

        const platformIdProperty = this.#getPlatformIdProperty(platform);
        player[platformIdProperty] = platformId;
        const playersRef = this.#datasource.collection(Schema.Collections.Accounts);

        const query = playersRef.where(platformIdProperty, '==', platformId);
        const result = await this.#datasource.runTransaction(async (transaction) => {
            const playerQuery = await transaction.get(query);

            if(!playerQuery.empty) {
                throw new Error(ChatRPG.Errors.playerExists);
            }

            const newPlayer = playersRef.doc();
            transaction.create(newPlayer, player);

            return newPlayer.id;
        });

        return result;
    }

    async findPlayerById(id, platform) {
        return (await this.#findPlayerbyPlatformId(id, platform)).data();
    }

    async joinGame(playerId, gameId) {
        //Make sure the user exists
        const player = await this.#findPlayer(playerId);

        const gameRef = this.#datasource.collection(Schema.Collections.Games).doc(gameId);

        //TODO the host's game mode from the config

        const gameData = await this.#datasource.runTransaction(async (transaction) => {
             const game = await transaction.get(gameRef);

            if(!game.exists) {
                const gameData = await GameModes.arena.createGame(this.#datasource);
                gameData.monsters = this.#flattenObjectArray(gameData.monsters);
                transaction.create(gameRef, gameData);

                return gameData;
            }

            return game.data();
        });

        const updateData = {};
        updateData[Schema.AccountFields.CurrentGameId] = gameId;
        await player.ref.update(updateData);
        
        gameData.monsters = this.#unflattenObjectArray(gameData.monsters);
        gameData[Schema.GameFields.GameId] = gameRef.id;
        return gameData;
        
    }

    async #findPlayer(id) {
        const playerSnapShot = await this.#datasource.collection(Schema.Collections.Accounts).doc(id).get();
        
        if(!playerSnapShot.exists) {
            throw new Error(ChatRPG.Errors.playerNotFound);
        }

        return playerSnapShot;
    }

    async #findPlayerbyPlatformId(platformId, platform) {
        const idProperty = this.#getPlatformIdProperty(platform);
        
        const playerQuerySnapShot = await this.#datasource.collection(Schema.Collections.Accounts).where(idProperty, '==', platformId).get();
        
        if(playerQuerySnapShot.empty) {
            throw new Error(ChatRPG.Errors.playerNotFound);
        }

        return playerQuerySnapShot.docs[0];
    }

    #getPlatformIdProperty(platform) {
        switch (platform) {
            case ChatRPG.Platforms.Twitch:
                return Schema.AccountFields.TwitchId;
        default:
            return '';
        }
    }

    #flattenObjectArray(array) {
        const newArray = [];

        array.forEach(element => {
            newArray.push(JSON.stringify(element));
        });

        return newArray;
    }

    #unflattenObjectArray(array) {
        const newArray = [];

        array.forEach(element => {
            newArray.push(JSON.parse(element));
        });

        return newArray;
    }
}

module.exports = ChatRPG;