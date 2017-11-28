var Base = requireBaseModule(),
    ApiUtils = require('./api-utils'),
    weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

var TrelloCard = function() {
    Base.call(this);
    this.respond(/(.*)?trello card(.*)?/i, (response) => {
        response.sendTyping();

        response.user.getSocialNetworkHandle('trello')
            .catch(() => this.requireUsername(response))
            .then(handle => {
                var cardTitle = response.user.name;
                if(cardTitle.trim().length === 0) {
                    cardTitle = response.user.username;
                }
                return this.createCardForUsername(handle, cardTitle);
            })
            .then(() => response.reply('Feito, amiguinho.'))
            .catch(err => {
                if(err instanceof Error) {
                    this.logger.error(err);
                    return response.reply('Eita! Aconteceu algo bem esquisito aqui e eu não consegui fazer alguma coisa. Ou eu fiz. Mas não sei. Calma, tô confuso.');
                }
                response.reply(err)
            })
            .then(handle => this.createCardForUsername('victorgama', 'Vito'))
            .then(handle => this.createCardForUsername('joaomarcosdesouza', 'João Marcos'));
    });
};

TrelloCard.prototype.createCardForUsername = function(name, cardTitle) {
    return ApiUtils.getUserIdForHandle(name)
        .then(userId => {
            return ApiUtils.getListFromBoard('SjRJiE2O')
                .then(listId => ({ userId, listId }));
        })
        .then(data => {
            return ApiUtils.userHasCard(data.userId, data.listId)
                .then(has => {
                    if(has) {
                        return Promise.reject('Você já está na lista dessa semana! :wink:')
                    }
                    return data;
                });
        })
        .then(data => {
            return ApiUtils.createCardForUser(data.userId, data.listId, cardTitle);
        })
        .then(cardId => {
            var i = 0,
                promises = weekDays
                    .map(v => ({ idCard: cardId, name: v, pos: i++ }))
                    .map(d => ApiUtils.createChecklistWithData(d, this.logger));
            return Promise.all(promises)
                .catch(ex => {
                    return Promise.reject("Não consegui criar seu checklist. :disappointed:");
                });
        })
        .then((cardsData) => {

            // Is Giskard in a good mood?
            if(Math.random() < 0.2) {

                // Pick a random day of the week
                var day = Math.min(4, Math.floor(Math.random() * 5)),
                    cardData = cardsData.find(c => c.pos === day),
                    name = 'Be awesome ✨';

                // And be nice to someone.
                return ApiUtils.createChecklistItemWithDataOnList(cardData.id, { name })
                    .catch((ex) => {
                        this.logger.error('Cannot create surprise task item: ');
                        this.logger.error(ex);
                        return Promise.resolve();
                    });
            }
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
            if(err && err.internal) {
                Promise.reject(err.message);
            } else if(err instanceof Error && !err.internal) {
                Promise.reject(err)
            } else {
                Promise.reject('Preciso do seu usuário no trello! :disappointed:');
            }
        });
}

module.exports = Base.setup(TrelloCard);
