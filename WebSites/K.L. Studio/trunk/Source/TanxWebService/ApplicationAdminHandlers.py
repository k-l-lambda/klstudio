
import os
import logging
import re
import datetime

from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.api import users

from Application import *


class ApplicationViewerHandler(webapp.RequestHandler):
    def get(self):
        id = re.sub('.*/app/([^/]+)/.*', r'\1', self.request.path)
        app = Application.getById(id)

        template_values = {
            'current_user':             users.get_current_user(),
            'logout_url':               users.create_logout_url(self.request.uri),
            'application':              app,
        }
        path = os.path.join(os.path.dirname(__file__), 'templates/ApplicationViewer.html')
        self.response.out.write(template.render(path, template_values))


class DeleteSessionHandler(webapp.RequestHandler):
    def post(self):
        app_id = self.request.get('app_id')
        app = Application.getById(app_id)

        for id in self.request.get_all('id'):
            session = Session.get_by_key_name(id, app)
            session.deleteData()

        self.redirect('./')


class ClearSessionsHandler(webapp.RequestHandler):
    def post(self):
        app_id = self.request.get('app_id')
        timeout = float(self.request.get('timeout') or 6)

        self.clear(app_id, timeout);

    def get(self):
        app_id = re.sub('.*/app/([^/]+)/.*', r'\1', self.request.path)
        timeout = float(self.request.str_GET.get('timeout') or 6)

        self.clear(app_id, timeout);

    def clear(self, app_id, timeout):
        logging.info('clearing sessions of application "%s"...', app_id)

        app = Application.getById(app_id)

        # clear dead sessions
        for session in Session.all().ancestor(app).filter('alive =', False):
            session.deleteData()

        # clear time out sessions
        for session in Session.all().ancestor(app).filter('alive_time <', datetime.datetime.now() - datetime.timedelta(hours = timeout)):
            session.deleteData()

        self.redirect('./')
