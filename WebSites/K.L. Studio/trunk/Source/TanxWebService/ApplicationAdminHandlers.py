
import os
import logging
import re

from google.appengine.ext import webapp
from google.appengine.ext.webapp import template

from Application import *


class ApplicationViewerHandler(webapp.RequestHandler):
    def get(self):
        id = re.sub('.*/app/([^/]+)/.*', r'\1', self.request.path)
        app = Application.getById(id)

        template_values = {
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
