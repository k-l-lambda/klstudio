
from google.appengine.ext import db
from google.appengine.api import users


class Session:
    host = db.UserProperty()
    next_host_message_id = db.IntegerProperty()
    next_guest_message_id = db.IntegerProperty()
