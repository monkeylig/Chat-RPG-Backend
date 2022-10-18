const chatrpg = {

    getStartingAvatars(datasource) {
        const avatars = datasource.getStartingAvatars();
        return avatars;
    },

    async addNewPlayer(datasource, name, avatar) {
        const player = {
            name: name,
            avatar: avatar,
            level: 1,
            attack: 1,
            magic_attack: 1,
            defence: 1,
            health: 10

        }

        try {
            await datasource.addAccount(player);
        } catch (error) {
            return false;
        }

        return true;
    }
};

module.exports = chatrpg;