
import logging

from google.appengine.ext import db
from google.appengine.api import users

from SessionMessage import *


class Session(db.Model):
    host = db.UserProperty()
    setup_time = db.DateTimeProperty(auto_now_add = True)
    alive_time = db.DateTimeProperty(auto_now_add = True)
    alive = db.BooleanProperty()
    next_host_message_id = db.IntegerProperty()
    next_guest_message_id = db.IntegerProperty()
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
        db.delete(SessionChannel.all().ancestor(self))
        db.delete(SessionHostMessage.all().ancestor(self))
        db.delete(SessionGuestMessage.all().ancestor(self))

        self.delete()

        logging.info('session "%s" data deleted.', self.id())

    def channels(self):
        return SessionChannel.all().ancestor(self)

    def hostMessages(self):
        return SessionHostMessage.all().ancestor(self).order('time')

    def guestMessages(self):
        return SessionGuestMessage.all().ancestor(self).order('time')

    def toDict(self):
        return {'id': self.id(), 'host': self.host, 'setup_time': self.setup_time, 'alive_time': self.alive_time, 'alive': self.alive, 'next_host_message_id': self.next_host_message_id, 'next_guest_message_id': self.next_guest_message_id, 'tags': self.tags}
