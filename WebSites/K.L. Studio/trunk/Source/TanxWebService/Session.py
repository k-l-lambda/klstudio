
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
