var Base = requireBaseModule(),
    Trello = require("node-trello");

var t = new Trello(process.env.trellotasks_key, process.env.trellotasks_token),
    checkModel = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
    username;

//----------------------
//Helper functions
//---------------------

function getRightList(boardId) {
    return new Promise((resolve, reject) => {
        t.get(`/1/boards/${boardId}/lists`, (err, data) => {
            if (err) {
                reject(Error("Network Error: " + err));
            }
            var boardList = data.sort((a) => {
                return new Date(a.name.split(" - "));
            });
            resolve(boardList[0].id);
        });
    });
}

function getUserID(username) {
    return new Promise((resolve, reject) => {
        t.get("/1/search/members", {
            query: username
        }, (err, data) => {
            if (err) {
                reject(Error("Network Error: " + err));
            }
            resolve(data[0].id);
        });
    });
}


function createCard(idList) {
    return new Promise((resolve, reject) => {
        getUserID(username).then((userID) => {
            var newCard = {
                name: username,
                idList: idList,
                idMembers: userID
            }
            t.post("1/cards", newCard, (err, data) => {
                if (err) {
                    reject(Error(err));
                }
                resolve(data.id);
            });
        });
    });
}

function createChecklist(idCard) {
    return new Promise((resolve, reject) => {
        checkModel.forEach((value, key) => {
            var newChecklist = {
                idCard: idCard,
                name: value,
                pos: key
            }
            t.post("/1/checklists", newChecklist, (err, data) => {
                if (err) {
                    reject(Error(err));
                }
            });
        });
        resolve();
    });
}

var Trellocard = function(bot) {
    Base.call(this, bot);
    this.respond(/(.*)?trello card(.*)?/i, (response) => {
        username = response.user.name;
        response.reply("Só um segundo.");
        getRightList("SjRJiE2O")
            .then((idList) => {
                return createCard(idList);
            })
            .then((idCard) => {
                return createChecklist(idCard);
            })
            .then(() => {
                response.reply("Feito, amiguinho.");
            });
    });
};

module.exports = Base.setup(Trellocard);
