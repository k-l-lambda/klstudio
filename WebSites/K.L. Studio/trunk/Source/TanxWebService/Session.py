
from google.appengine.ext import db
from google.appengine.api import users


class Session(db.Model):
    host = db.UserProperty()
    setup_time = db.DateTimeProperty(auto_now_add = True)
    active = db.BooleanProperty()
    next_host_message_id = db.IntegerProperty()
    next_guest_message_id = db.IntegerProperty()

    def id(self):
        return self.key().name()
