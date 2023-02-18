const Collections = {
    StartingAvatars: 'starting_avatars',
    Accounts: 'accounts',
    Games: 'games'
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

    async getStartingAvatars(datasource) {
        let avatars = [];
        try {
            avatars = await datasource.getCollection(Collections.StartingAvatars);
        } catch (error) {
            throw new Error('internal Error');
        }

        return avatars;
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

        try {
            const existingPlayer = await datasource.findDocumentInCollection(platformId, platformIdProperty, Collections.Accounts)
            
            if(existingPlayer.hasOwnProperty(AccountFields.TwitchId))
            {
                return false;
            }

            await datasource.addDocumentToCollection(player, Collections.Accounts);
        } catch (error) {
            throw new Error('internal Error');
        }

        return true;
    },

    async findPlayerById(datasource, twitchId, platform) {
        let player = null;
        try {
            player = await datasource.findDocumentInCollection(twitchId, getPlatformIdProperty(platform), Collections.Accounts);
        } catch (error) {
            throw new Error('internal Error');
        }
        
        return player;
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
        const player = await this.findPlayerById(datasource, userId, platform);
       
        if(!isDataSourceObject(player)) {
            throw new Error('player ID does not exist');
        }

        const game = await this.verifyGameExists(datasource, gameId);

        const filter = {};
        filter[getPlatformIdProperty(platform)] = userId;

        const updateDoc = {
            $set: {}
        };
        updateDoc['$set'][AccountFields.CurrentGameId] = gameId;

        await datasource.updateDocumentInCollection(filter, updateDoc, Collections.Accounts);
        player[AccountFields.CurrentGameId] = gameId;

        return {player: player, game: game};
        
    }
};

module.exports = chatrpg;