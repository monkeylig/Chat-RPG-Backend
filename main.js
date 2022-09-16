const http = require('http');
const fs = require('fs/promises');
const FileSystemDataSource = require("./data-source/file-system-data-source");

function startServer() {
    const port = process.env.PORT || 3000

    const server = http.createServer((req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html')
        res.end('<h1>Hello, World!</h1>')
    })

    server.listen(port, () => {
        console.log(`Server running at port ${port}`)
    })
}

async function writeFile(obj) {
    let fileHandle;
    try {
        fileHandle = await fs.open("test.json", 'w');
        await fileHandle.writeFile(JSON.stringify(obj));
        console.log("File written");
    } finally {
        fileHandle.close();
    }
}

async function readFile() {
    let fileHandle;
    try {
        fileHandle = await fs.open("test.json", 'r');
        let fileContent = await fileHandle.readFile({encoding: 'UTF8'});
        console.log(fileContent);
    } finally {
        fileHandle.close();
    }
}

function testAccounts()
{
    let fsd = new FileSystemDataSource();
    fsd.addAccount({ name: 'jhard', level: 1 });
}

let obj = {
    name: "Jhard",
    level: 10
};

testAccounts();
