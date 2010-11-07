
from google.appengine.ext import db

from Session import *


class Application(db.Model):
    def id(self):
        return self.key().name()

    @staticmethod
    def getById(id):
        return Application.get_by_key_name(id)

    def sessionList(self, active = None):
        sessions = Session.all().ancestor(self)

        if not active is None:
            sessions = sessions.filter('active = ', active)

        sessions = sessions.order('setup_time')

        return sessions

    def deleteData(self):
        for session in Session.all().ancestor(self):
            session.deleteData()

        self.delete()

        logging.info('application "%s" data deleted.', self.id())
