var Base = requireBaseModule(),
    ApiUtils = require('./api-utils'),
    weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

var TrelloCard = function() {
    Base.call(this);
    this.respond(/(.*)?trello card(.*)?/i, (response) => {
        response.sendTyping();

        response.user.getSocialNetworkHandle('trello')
            .catch(() => this.requireUsername(response))
            .then(handle => ApiUtils.getUserIdForHandle(handle))
            .then(userId => {
                return ApiUtils.getListFromBoard('SjRJiE2O')
                    .then(listId => ({ userId, listId }));
            })
            .then(data => {
                var cardTitle = response.user.name;
                if(cardTitle.trim().length === 0) {
                    cardTitle = response.user.username;
                }
                return ApiUtils.createCardForUser(data.userId, data.listId, cardTitle);
            })
            .then(cardId => {
                var i = 0,
                    promises = weekDays
                        .map(v => ({ idCard: cardId, name: v, pos: i++ }))
                        .map(d => ApiUtils.createChecklistItemWithData(d, this.logger));
                return Promise.all(promises)
                    .catch(ex => {
                        return Promise.reject("Não consegui criar seu checklist. :disappointed:");
                    });
            })
            .then(() => response.reply('Feito, amiguinho.'))
            .catch(err => {
                if(err instanceof Error) {
                    this.logger.error(err);
                    return response.reply('Eita! Aconteceu algo bem esquisito aqui e eu não consegui fazer alguma coisa. Ou eu fiz. Mas não sei. Calma, tô confuso.');
                }
                response.reply(err)
            });
    });
};

TrelloCard.prototype.requireUsername = function(response) {
    return response.ask('Qual seu usuário no Trello?', this.Context.REGEX, /(.*)/)
        .then((answer) => {
            return response.user.updateSocialNetworkHandle('trello', answer.match[1])
                .then(() => {
                    response.reply('Ok, peraí...');
                    response.sendTyping();
                    return answer.match[1];
                })
                .catch((err) => {
                    return Promise.reject({
                        internal: true,
                        message: 'Não consegui memorizar seu usuário :disappointed:'
                    });
                });
        })
        .catch((err) => {
            if(err.internal) {
                Promise.reject(err.message);
            } else if(err instanceof Error && !err.internal) {
                Promise.reject(err)
            } else {
                Promise.reject('Preciso do seu usuário no trello! :disappointed:');
            }
        });
}

module.exports = Base.setup(TrelloCard);
