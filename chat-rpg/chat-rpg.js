const Collections = {
    Avatars: 'avatars',
    Accounts: 'accounts',
    Games: 'games'
}

const AvatarFields = {
    StartingAvatars: 'starting_avatars'
}

const AccountFields = {
    TwitchId: 'twitchId',
    CurrentGameId: 'currentGameId'
}

const GameFields = {
    GameId: 'gameId'    
}

const Platforms = {
    Twitch: 'twitch'
}

function isDataSourceObject(obj) {
    return obj.hasOwnProperty('_id');
}

function getPlatformIdProperty(platform) {
    switch (platform) {
        case Platforms.Twitch:
            return AccountFields.TwitchId;
    default:
        return '';
    }
}

const chatrpg = {

    Errors: {
        playerExists: 'player exists',
        playerNotFound: 'player not found'
    },

    async getStartingAvatars(datasource) {
        const avatars = await datasource.collection(Collections.Avatars).doc(AvatarFields.StartingAvatars).get();
        return avatars.data();
    },

    async addNewPlayer(datasource, name, avatar, platformId, platform) {
        const player = {
            name: name,
            avatar: avatar,
            level: 1,
            attack: 1,
            magic_attack: 1,
            defence: 1,
            health: 10
        }

        const platformIdProperty = getPlatformIdProperty(platform);
        player[platformIdProperty] = platformId;
        const playersRef = datasource.collection(Collections.Accounts);

        const query = playersRef.where(platformIdProperty, '==', platformId);
        const result = await datasource.runTransaction(async (transaction) => {
            const playerQuery = await transaction.get(query);

            if(!playerQuery.empty) {
                throw new Error(this.Errors.playerExists);
            }

            const newPlayer = playersRef.doc();
            transaction.create(newPlayer, player);
        });

        if(result == this.Errors.playerExists)
        {
            throw new Error(this.Errors.playerExists);
        }

        return true;
    },

    async findPlayerById(datasource, platformId, platform) {
        const idProperty = getPlatformIdProperty(platform);
        
        const playerQuerySnapShot = await datasource.collection(Collections.Accounts).where(idProperty, '==', platformId).get();
        
        if(playerQuerySnapShot.empty) {
            throw new Error(this.Errors.playerNotFound);
        }

        return playerQuerySnapShot.docs[0].data();
    },

    async findGameById(datasource, gameId) {
        let game = null;
        try {
            game = await datasource.findDocumentInCollection(gameId, GameFields.GameId, Collections.Games)
        } catch (error) {
            throw new Error('internal Error');
        }

        return game;
    },

    async verifyGameExists(datasource, gameId) {
        let game = await this.findGameById(datasource, gameId);

        if(isDataSourceObject(game)) {
            return game;
        }

        const newGame = {
            gameId: gameId
        };

        try {
            game = await datasource.addDocumentToCollection(newGame, Collections.Games)
        } catch (error) {
            throw new Error('internal Error');
        }

        return game;
    },

    async joinGame(datasource, userId, gameId, platform) {
        //Make sure the user exists
        /*const player = await this.findPlayerById(datasource, userId, platform);

        const gameRef = datasource.collection(Collections.Games).doc(gameId);

        datasource.runTransaction(async (transaction) => {
            const game = await transaction.get(gameRef);

            if(!game.exists) {
                //TODO add game initialization code here
                transaction.create(documentRef, data);
            }
        });

        return {player: player, game: game};*/
        
    }
};

module.exports = chatrpg;