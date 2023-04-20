const { uniqueNamesGenerator, names, adjectives, colors, animals, countries, starWars } = require("unique-names-generator");



function test(){
    let randomNames = []
    for(let i = 0; i < 50; i++){
        let name = uniqueNamesGenerator({
            dictionaries: [colors, adjectives, names],
        });
        randomNames.push(name);
    }
    console.log(randomNames);
}

test();