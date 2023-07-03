const Schema = {
    Collections: {
        Avatars: 'avatars',
        Accounts: 'accounts',
        Games: 'games',
        Monsters: 'monsters',
        Battles: 'battles',
        Shops: 'shops'
    },
    
    AvatarDocuments: {
        StartingAvatars: 'starting_avatars'
    },

    AvatarFields: {
        Content: 'content'
    },
    
    AccountFields: {
        //Id: 'id', optional
        Name: 'name',
        Avatar: 'avatar',
        TwitchId: 'twitchId', //optional
        CurrentGameId: 'currentGameId',
        Health: 'health',
        MaxHealth: 'maxHealth',
        Attack: 'attack',
        Defence: 'defence',
        Magic: 'magic',
        Weapon: 'weapon',
        Exp: 'exp',
        Abilities: 'abilities',
        Level: 'level'
    },
    
    GameFields: {
        GameId: 'id'
    },

    MonsterFields: {
        Name: 'name',
        MonsterNumber: 'monsterNumber'
    },

    BattleFields: {
        Player: 'player',
        Monster: 'monster',
        GameId: 'gameId'
    },

    BattlePlayerFields: {
        Id: 'id',
        Name: 'name',
        Avatar: 'avatar',
        MaxHealth: 'maxHealth',
        CurrentHealth: 'health',
        Attack: 'attack',
        Defence: 'defence',
        Magic: 'magic',
        Weapon: 'weapon',
        Abilities: 'abilities',
        AbilityPoints: 'ap',
        Level: 'level',
        StrikeLevel: 'strikeLevel'
    },

    BookObjects: {
        name: '', //(string) name of the book
        abilities: {}, //(ability objects) abilities inside the book
    },

    AbilityObjects: {
        name: '', //(string) Name of ability
        damage: 0 //(number) Base damage of the ability
    },

    ItemObjects: {
        name: '', //(string) name of item
        count: 0, //(numer) the number of copies of the item
    }
}

module.exports = Schema;