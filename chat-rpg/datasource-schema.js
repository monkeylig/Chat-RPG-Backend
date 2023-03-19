const Schema = {
    Collections: {
        Avatars: 'avatars',
        Accounts: 'accounts',
        Games: 'games',
        Monsters: 'monsters',
        Battles: 'battles'
    },
    
    AvatarDocuments: {
        StartingAvatars: 'starting_avatars'
    },

    AvatarFields: {
        Content: 'content'
    },
    
    AccountFields: {
        TwitchId: 'twitchId',
        CurrentGameId: 'currentGameId',
        Health: 'health',
        Attack: 'attack',
        Defence: 'defence',
        Magic: 'magic',
        Weapon: 'weapon',
        Exp: 'exp',
        Level: 'level'
    },
    
    GameFields: {
        GameId: 'gameId'
    },

    MonsterFields: {
        Name: 'name',
        MonsterNumber: 'monsterNumber'
    },

    BattleFields: {
        Player: 'player',
        monster: 'monster'
    },

    BattlePlayerFields: {
        MaxHealth: 'maxHealth',
        CurrentHealth: 'health',
        Attack: 'attack',
        Defence: 'defence',
        Magic: 'magic',
        Weapon: 'weapon',
        AbilityPoints: 'ap',
        Level: 'level'
    },

    BattleMonsterFields: {
        MaxHealth: 'maxHealth',
        CurrentHealth: 'health',
        Attack: 'attack',
        Defence: 'defence',
        Magic: 'magic',
        AbilityPoints: 'ap',
        Level: 'level'
    }
}

module.exports = Schema;