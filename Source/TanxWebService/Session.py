
import logging

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.api import memcache

from SessionMessage import *


class Session(db.Model):
    host = db.UserProperty()
    setup_time = db.DateTimeProperty(auto_now_add = True)
    alive_time = db.DateTimeProperty(auto_now_add = True)
    alive = db.BooleanProperty()
    next_host_message_id = db.IntegerProperty(default = 0)
    next_guest_message_id = db.IntegerProperty(default = 0)
    tags = db.StringListProperty()

    def id(self):
        return self.key().name()

    def genNewHostMessageId(self):
        self.next_host_message_id = self.next_host_message_id or 0
        id = str(self.next_host_message_id)

        self.next_host_message_id += 1
        self.put()

        return id

    def genNewGuestMessageId(self):
        self.next_guest_message_id = self.next_guest_message_id or 0
        id = str(self.next_guest_message_id)

        self.next_guest_message_id += 1
        self.put()

        return id

    def deleteData(self):
        self.parent().cacheSession(self)

        db.delete(SessionChannel.all().ancestor(self))
        db.delete(SessionHostMessage.all().ancestor(self))
        db.delete(SessionGuestMessage.all().ancestor(self))

        self.delete()

        logging.info('session "%s" data deleted.', self.id())

    def channels(self):
        channels = SessionChannel.all().ancestor(self)
        if channels:
            return channels

        session_data = memcache.get('TanxWebService_SessionData:' + self.id())
        if session_data:
            return session_data['channels']

        return channels

    def hostMessages(self):
        messages = SessionHostMessage.all().ancestor(self).order('time')
        if messages and messages.count():
            return messages

        session_data = memcache.get('TanxWebService_SessionData:' + self.id())
        if session_data:
            return session_data['hostMessages']

        return messages

    def guestMessages(self):
        messages = SessionGuestMessage.all().ancestor(self).order('time')
        if messages:
            return messages

        session_data = memcache.get('TanxWebService_SessionData:' + self.id())
        if session_data:
            return session_data['guestMessages']

        return messages

    def toDict(self):
        return {'id': self.id(), 'host': self.host, 'setup_time': self.setup_time, 'alive_time': self.alive_time, 'alive': self.alive, 'next_host_message_id': self.next_host_message_id, 'next_guest_message_id': self.next_guest_message_id, 'tags': self.tags}

    @staticmethod
    def get(id, parent):
        session = Session.get_by_key_name(id, parent)
        if session:
            return session

        session_data = memcache.get('TanxWebService_SessionData:' + id)
        if session_data:
            return session_data['session']

    def isCached(self):
        return memcache.get('TanxWebService_SessionData:' + self.id()) is not None
