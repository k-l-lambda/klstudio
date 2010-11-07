
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


class SessionChannel(db.Model):
    members = db.ListProperty(users.User)

    def id(self):
        return self.key().name()

    @staticmethod
    def getById(id, session):
        channel = SessionChannel.get_by_key_name(id, session)
        if channel is None:
            channel = SessionChannel(key_name = id, parent = session)
            channel.put()

        return channel
