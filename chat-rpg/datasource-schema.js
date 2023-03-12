const Schema = {
    Collections: {
        Avatars: 'avatars',
        Accounts: 'accounts',
        Games: 'games',
        Monsters: 'monsters'
    },
    
    AvatarDocuments: {
        StartingAvatars: 'starting_avatars'
    },

    AvatarFields: {
        Content: 'content'
    },
    
    AccountFields: {
        TwitchId: 'twitchId',
        CurrentGameId: 'currentGameId'
    },
    
    GameFields: {
        GameId: 'gameId'
    },

    MonsterFields: {
        Name: 'name',
        MonsterNumber: 'monsterNumber'
    }
}

module.exports = Schema;