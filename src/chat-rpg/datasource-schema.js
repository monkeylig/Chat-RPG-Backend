const Schema = {
    Collections: {
        Avatars: 'avatars',
        Configs: 'configs',
        Accounts: 'accounts',
        Games: 'games',
        Monsters: 'monsters',
        Battles: 'battles',
        Shops: 'shops',
        InventoryPages: 'inventory_pages',
        Products: 'products',
        DailyReports: 'daily_reports',
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
        Strength: 'strength',
        Defense: 'defense',
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
        Strength: 'strength',
        Defense: 'defense',
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
        count: 0, //(number) the number of copies of the item
    }
}

module.exports = {Schema};