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
                reject('Não consegui achar a lista de tarefas :disappointed:');
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
                reject('Não consegui achar seu usuário :disappointed:');
            }
            resolve(data[0].id);
        });
    });
}


function createCard(idList, username) {
    return new Promise((resolve, reject) => {
        getUserID(username)
            .then((userID) => {
                var newCard = {
                    name: username,
                    idList: idList,
                    idMembers: userID
                }
                t.post("1/cards", newCard, (err, data) => {
                    if (err) {
                        reject('Não consegui criar seu card :disappointed:');
                    }
                    resolve(data.id);
                });
            });
    });
}

function commitChecklistItem(newChecklist) {
    return new Promise((resolve, reject) => {
        t.post("/1/checklists", newChecklist, (err, data) => {
            if (err) {
                console.log(err);
                return reject('Não consegui criar os checklists :disappointed:');
            }
            resolve();
        });
    });
}

function createChecklist(idCard) {
    var i = 0;
    console.log(idCard);
    return Promise.all(checkModel.map((value) => commitChecklistItem({
        idCard: idCard,
        name: value,
        pos: i++
    })));
}

var Trellocard = function(bot) {
    Base.call(this, bot);
    this.respond(/(.*)?trello card(.*)?/i, (response) => {
        username = response.user.name;
        response.sendTyping();
        getRightList("SjRJiE2O")
            .then((idList) => {
                return response.user.getSocialNetworkHandle('trello')
                    .then((handle) => {
                        return Promise.resolve({
                            handle: handle,
                            list: idList
                        });
                    })
                    .catch((err) => {
                        return response.ask('Qual seu usário no Trello?', this.Context.REGEX, /(.*)/)
                            .then((answer) => {
                                return response.user.updateSocialNetworkHandle('trello', answer.match[1])
                                    .then(() => {
                                        return Promise.resolve({
                                            handle: answer.match[1],
                                            list: idList
                                        });
                                    })
                                    .catch((err) => {
                                        return Promise.reject('Não consegui memorizar seu usuário :disappointed:');
                                    })
                            })
                            .catch((err) => {
                                return Promise.reject('Preciso do seu usuário no trello! :disappointed:');
                            });
                    });
                //return createCard(idList);
            })
            .then((data) => {
                return createCard(data.list, data.handle);
            })
            .then((idCard) => {
                return createChecklist(idCard)
                .catch((err) => {
                    return Promise.reject(err);
                });
            })
            .then(() => {
                response.reply("Feito, amiguinho.");
            })
            .catch((err) => {
                response.reply(err);
            });
    });
};

module.exports = Base.setup(Trellocard);
