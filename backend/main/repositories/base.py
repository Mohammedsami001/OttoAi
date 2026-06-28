class BaseRepository:
    def __init__(self, db=None):
        if db is not None:
            self.db = db
        else:
            from main.db import mongo_manager
            self.db = mongo_manager.db
