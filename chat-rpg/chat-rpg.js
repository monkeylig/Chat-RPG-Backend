const Collections = {
    StartingAvatars: 'starting_avatars',
    Accounts: 'accounts',
    Games: 'games'
}

const AccountFields = {
    TwitchId: 'twitchId'
}

const GameFields = {
    GameId: 'gameId'    
}

function isDataSourceObject(obj) {
    return obj.hasOwnProperty('_id');
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

    async addNewPlayer(datasource, name, avatar, twitchId) {
        const player = {
            name: name,
            avatar: avatar,
            twitchId: twitchId,
            level: 1,
            attack: 1,
            magic_attack: 1,
            defence: 1,
            health: 10
        }

        try {
            const existingPlayer = await datasource.findDocumentInCollection(twitchId, AccountFields.TwitchId, Collections.Accounts)
            
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

    async findPlayerByTwitchId(datasource, twitchId) {
        let player = null;
        try {
            player = await datasource.findDocumentInCollection(twitchId, AccountFields.TwitchId, Collections.Accounts);
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

    async joinTwitchGame(datasource, userTwitchId, gameId) {
        //Make sure the user exists
        const player = await this.findPlayerByTwitchId(datasource, userTwitchId);
       
        if(!isDataSourceObject(player)) {
            throw new Error('player ID does not exist');
        }

        const game = this.verifyGameExists(datasource, gameId);
        
    }
};

module.exports = chatrpg;