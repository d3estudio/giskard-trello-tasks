var Trello = require("node-trello");

module.exports = {
    /**
     * Returns a new Trello API Client instance
     * @return {Trello} Trello Client instance
     */
    getApiClient: function() {
        return new Trello(process.env.trellotasks_key, process.env.trellotasks_token);
    },

    /**
     * Gets the current list from the main board
     * @param  {String} boardId ID of the board to have the list id extracted from
     * @return {Promise}         Promise that will be resolved when the list is
     *                           acquired
     */
    getListFromBoard: function(boardId) {
        return new Promise((resolve, reject) => {
            this.getApiClient().get(`/1/boards/${boardId}/lists`, (err, data) => {
                if (err || !data || data.length < 1) {
                    return reject('Não consegui achar a lista de tarefas :disappointed:');
                }
                var boardList = data.sort(a => new Date(a.name.split(" - ")));
                resolve(boardList[0].id);
            });
        });
    },

    /**
     * Creates a new card for the given user, in the given list, with the given
     * title
     * @param  {String} userId ID of the User to whom the card will be created
     * @param  {String} listId ID of the list where the card will be added to
     * @param  {String} title  Title of the card to be created
     * @return {Promise}        Promise that will be resolved or rejected
     *                          depending on the success of the operation
     */
    createCardForUser: function(userId, listId, title) {
        return new Promise((resolve, reject) => {
            var newCard = {
                name: title,
                idList: listId,
                idMembers: userId
            };
            this.getApiClient().post("1/cards", newCard, (err, data) => {
                if (err) {
                    return reject('Não consegui criar seu card :disappointed:');
                }
                resolve(data.id);
            });
        });
    },

    /**
     * Gets an ID for a user with a given handle
     * @param  {String} handle Handle of the user to have its ID acquired
     * @return {Promise}        Promise that will be resolved with the user's
     *                          id, if found, or rejected.
     */
    getUserIdForHandle: function(handle) {
        return new Promise((resolve, reject) => {
            this.getApiClient().get("/1/search/members", {
                query: handle
            }, (err, data) => {
                if (err) {
                    return reject(`Não consegui achar seu usuário! Tem certeza que \`${handle}\` está certo? :disappointed:`);
                }
                resolve(data[0].id);
            });
        });
    },

    /**
     * Creates a new checklist with the given data
     * @param  {AnyObject} data   Object describing the new checklist item
     * @param  {logger} logger Logger instance, bound with module data, used
     *                         for debugging purposes
     * @return {Promise}        Promise that will be resolved or rejected
     *                          depending on the operation result
     */
    createChecklistWithData: function(data, logger) {
        return new Promise((resolve, reject) => {
            this.getApiClient().post("/1/checklists", data, (err, data) => {
                if (err) {
                    logger.error(err);
                    return reject();
                }
                resolve(data);
            });
        });
    },

    /**
     * Creates a checklist item on a given list id, using the provided data
     * as argument
     * @param  {String} listId Id of the list where the item should be created
     * @param  {AnyObject} data   Object describing the item to be added to the
     *                            list
     * @return {Promise}        Promise that will be rejected or resolved
     *                          depending on the operation result
     */
    createChecklistItemWithDataOnList: function(listId, data) {
        return new Promise((resolve, reject) => {
            this.getApiClient().post(`/1/checklists/${listId}/checkItems`, data, (err, data) => {
                if (err) {
                    return reject();
                }
                resolve();
            });
        });
    }
}
