const BackendDataSource = require('./backend-data-source');

test('Testing filtering helper', () => {
    const collection = [
        {
            name: 'echo',
            power: 'copy'
        },
        {
            name: 'Cassidy',
            power: 'shoot',
        },
        {
            name: 'Winston',
            power: 'copy',
        }
    ]
    const datasource = new BackendDataSource();

    let filter = {
        power: 'copy'
    }
    let filteredArray = datasource.filterCollectionArray(filter, collection);

    expect(filteredArray.length).toEqual(2);

    expect(filteredArray[0]).toStrictEqual(collection[0]);
    expect(filteredArray[1]).toStrictEqual(collection[2]);

    filter = {
        name: 'Cassidy'
    }

    filteredArray = datasource.filterCollectionArray(filter, collection);

    expect(filteredArray.length).toEqual(1);
    expect(filteredArray[0]).toStrictEqual(collection[1]);

    filter = {
        name: 'echo',
        power: 'copy'
    }

    filteredArray = datasource.filterCollectionArray(filter, collection);

    expect(filteredArray.length).toEqual(1);
    expect(filteredArray[0]).toStrictEqual(collection[0]);

    filter = {
        name: 'tracer'
    }

    filteredArray = datasource.filterCollectionArray(filter, collection);

    expect(filteredArray.length).toEqual(0);

});

test.only('Testing update doc', () => {
    const hero = {
        name: 'echo',
        power: 'copy',
        abilities: ['e', 'shift']
    }

    const datasource = new BackendDataSource();

    let updateDoc = {
        set: [
            ['name', 'tracer']
        ]
    }

    datasource.applyUpdateDoc(updateDoc, hero);

    expect(hero.name).toEqual('tracer');

    updateDoc = {
        set: [
            ['name', 'sombra'],
            ['power', 'hack']
        ]
    }

    datasource.applyUpdateDoc(updateDoc, hero);

    expect(hero.name).toEqual('sombra');
    expect(hero.power).toEqual('hack');

    updateDoc = {
        set: [
            ['skin', 'OW2']
        ]
    }

    datasource.applyUpdateDoc(updateDoc, hero);

    expect(hero.hasOwnProperty('skin')).toBeTruthy();
    expect(hero.skin).toEqual('OW2');

    updateDoc = {
        push: [
            ['abilities', 'q']
        ]
    }

    datasource.applyUpdateDoc(updateDoc, hero);

    expect(hero.abilities.length).toEqual(3);
    expect(hero.abilities[2]).toEqual('q');

    updateDoc = {
        push: [
            ['enemies', 'doomfist'],
            ['enemies', 'winston'],
            ['emotes', 'victory']
        ]
    }

    datasource.applyUpdateDoc(updateDoc, hero);

    expect(hero.hasOwnProperty('enemies')).toBeTruthy();
    expect(hero.hasOwnProperty('emotes')).toBeTruthy();
    expect(hero.enemies.length).toEqual(2);
    expect(hero.emotes.length).toEqual(1);
    expect(hero.enemies[0]).toEqual('doomfist');
    expect(hero.enemies[1]).toEqual('winston');
    expect(hero.emotes[0]).toEqual('victory');

    updateDoc = {
        pull: {
            enemies: ['doomfist']
        }
    }

    datasource.applyUpdateDoc(updateDoc, hero);
    expect(hero.enemies.length).toEqual(1);
    expect(hero.enemies[0]).toEqual('winston');

});