
from google.appengine.ext import db

from Session import *


class Application(db.Model):
    @staticmethod
    def getById(id):
        # TODO: check authority
        app = Application.get_by_key_name(id)
        if app is None:
            app = Application(key_name = id)
            app.put()

        return app

    def sessionList(self, active = None):
        sessions = Session.all()

        if not active is None:
            sessions = sessions.filter('active = ', active)

        return sessions
