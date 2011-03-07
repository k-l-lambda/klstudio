
from google.appengine.ext import db
from google.appengine.api import memcache

from Session import *


class Application(db.Model):
    cache_session_ids = db.StringListProperty()

    def id(self):
        return self.key().name()

    @staticmethod
    def getById(id):
        return Application.get_by_key_name(id)

    def sessionList(self, alive = None):
        sessions = Session.all().ancestor(self)

        if not alive is None:
            sessions = sessions.filter('alive =', alive)

        sessions = sessions.order('-setup_time')

        return sessions

    def deleteData(self):
        for session in Session.all().ancestor(self):
            session.deleteData()

        self.delete()

        logging.info('application "%s" data deleted.', self.id())

    def cacheSession(self, session):
        self.cache_session_ids.insert(0, session.id())
        while len(self.cache_session_ids) > 2000:
            memcache.delete('TanxWebService_SessionData:' + self.cache_session_ids.pop())
        self.put()

        session_data = {
            'session': session,
            'channels': session.channels().fetch(1000),
            'hostMessages': session.hostMessages().fetch(1000),
            'guestMessages': session.guestMessages().fetch(1000),
        }

        memcache.set('TanxWebService_SessionData:' + session.id(), session_data)

    def removeCacheSession(self, id):
        self.cache_session_ids.remove(id)
        self.put()

        memcache.delete('TanxWebService_SessionData:' + id)

        logging.info('cached session "%s" removed.', id)
