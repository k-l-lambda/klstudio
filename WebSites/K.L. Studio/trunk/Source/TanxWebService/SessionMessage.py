
from google.appengine.ext import db
from google.appengine.api import users


class SessionHostMessage(db.Model):
    data = db.TextProperty()
    time = db.DateTimeProperty(auto_now_add = True)
    channels = db.StringListProperty()
    audiences = db.ListProperty(users.User)

    def id(self):
        return self.key().name()


class SessionGuestMessage(db.Model):
    data = db.TextProperty()
    time = db.DateTimeProperty(auto_now_add = True)
    sender = db.UserProperty()

    def id(self):
        return self.key().name()
