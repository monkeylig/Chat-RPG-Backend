
class ChatRPG {
    #datasource;

    static Collections = {
        Avatars: 'avatars',
        Accounts: 'accounts',
        Games: 'games'
    }
    
    static AvatarDocuments = {
        StartingAvatars: 'starting_avatars'
    }

    static AvatarFields = {
        Content: 'content'
    }
    
    static AccountFields = {
        TwitchId: 'twitchId',
        CurrentGameId: 'currentGameId'
    }
    
    static GameFields = {
        GameId: 'gameId'
    }
    
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
        const avatars = await this.#datasource.collection(ChatRPG.Collections.Avatars).doc(ChatRPG.AvatarDocuments.StartingAvatars).get();
        return avatars.data()[ChatRPG.AvatarFields.Content];
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
        const playersRef = this.#datasource.collection(ChatRPG.Collections.Accounts);

        const query = playersRef.where(platformIdProperty, '==', platformId);
        const result = await this.#datasource.runTransaction(async (transaction) => {
            const playerQuery = await transaction.get(query);

            if(!playerQuery.empty) {
                throw new Error(ChatRPG.Errors.playerExists);
            }

            const newPlayer = playersRef.doc();
            transaction.create(newPlayer, player);
        });

        if(result == ChatRPG.Errors.playerExists)
        {
            throw new Error(ChatRPG.Errors.playerExists);
        }

        return true;
    }

    async findPlayerById(platformId, platform) {
        return (await this.#findPlayer(platformId, platform)).data();
    }

    async joinGame(userId, gameId, platform) {
        //Make sure the user exists
        const player = await this.#findPlayer(userId, platform);

        const gameRef = this.#datasource.collection(ChatRPG.Collections.Games).doc(gameId);

        //TODO add game initialization code here
        let gameData = { mode: 'default' };
        await this.#datasource.runTransaction(async (transaction) => {
            const game = await transaction.get(gameRef);

            if(!game.exists) {
                transaction.create(gameRef, gameData);
            }
            else {
                gameData = game.data();
            }
        });

        const updateData = {};
        updateData[ChatRPG.AccountFields.CurrentGameId] = gameId;
        await player.ref.update(updateData);
        
        gameData[ChatRPG.GameFields.GameId] = gameRef.id;
        return gameData;
        
    }

    async #findPlayer(platformId, platform) {
        const idProperty = this.#getPlatformIdProperty(platform);
        
        const playerQuerySnapShot = await this.#datasource.collection(ChatRPG.Collections.Accounts).where(idProperty, '==', platformId).get();
        
        if(playerQuerySnapShot.empty) {
            throw new Error(ChatRPG.Errors.playerNotFound);
        }

        return playerQuerySnapShot.docs[0];
    }
    #getPlatformIdProperty(platform) {
        switch (platform) {
            case ChatRPG.Platforms.Twitch:
                return ChatRPG.AccountFields.TwitchId;
        default:
            return '';
        }
    }
}

module.exports = ChatRPG;