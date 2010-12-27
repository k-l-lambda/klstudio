
from google.appengine.ext import db
from google.appengine.api import users

import Serializer


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


class SessionHostMessage(db.Model):
    data = db.TextProperty()
    time = db.DateTimeProperty(auto_now_add = True)
    channels = db.StringListProperty()
    audiences = db.ListProperty(users.User)

    def id(self):
        return self.key().name()

    def isReceiver(self, guest):
        if guest in self.audiences:
            return True

        for channel_id in self.channels:
            channel = SessionChannel.getById(channel_id, self.parent())
            if guest in channel.members:
                return True

        return False

    def toDict(self):
        return {'data': Serializer.PlainText(self.data), 'time': self.time}


class SessionGuestMessage(db.Model):
    data = db.TextProperty()
    time = db.DateTimeProperty(auto_now_add = True)
    sender = db.UserProperty()

    def id(self):
        return self.key().name()

    def toDict(self):
        return {'data': Serializer.PlainText(self.data), 'time': self.time, 'sender': self.sender}
