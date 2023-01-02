const utility = require('./utility');

test('Testing parameter validation', async () => {
    let payload = {
        name: "Guy",
        age: 34,
        car: "lincoln",
        grade: 4.0
    }

    expect(utility.validatePayloadParameters(payload, [
        { name: 'name', type: 'string'},
        { name: 'age', type: 'number'},
        { name: 'car', type: 'string'},
        { name: 'grade', type: 'number'}
    ])).toBeTruthy();

    expect(utility.validatePayloadParameters(payload, [
        { name: 'name', type: 'string'},
        { name: 'age', type: 'number'},
        { name: 'car', type: 'object'},
        { name: 'grade', type: 'number'}
    ])).toBeFalsy();

    payload.name = 9;
    expect(utility.validatePayloadParameters(payload, [
        { name: 'name', type: 'string'},
        { name: 'age', type: 'number'},
        { name: 'car', type: 'string'},
        { name: 'grade', type: 'number'}
    ])).toBeFalsy();

    expect(utility.validatePayloadParameters({}, [
        { name: 'name', type: 'string'},
        { name: 'age', type: 'number'},
        { name: 'car', type: 'object'},
        { name: 'grade', type: 'number'}
    ])).toBeFalsy();

    expect(utility.validatePayloadParameters(undefined, [
        { name: 'name', type: 'string'},
        { name: 'age', type: 'number'},
        { name: 'car', type: 'object'},
        { name: 'grade', type: 'number'}
    ])).toBeFalsy();

    expect(utility.validatePayloadParameters(null, [
        { name: 'name', type: 'string'},
        { name: 'age', type: 'number'},
        { name: 'car', type: 'object'},
        { name: 'grade', type: 'number'}
    ])).toBeFalsy();

    expect(utility.validatePayloadParameters(undefined, [])).toBeTruthy();
    expect(utility.validatePayloadParameters({}, [])).toBeTruthy();
    expect(utility.validatePayloadParameters(null, [])).toBeTruthy();
});