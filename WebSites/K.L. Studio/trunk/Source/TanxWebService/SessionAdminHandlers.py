
import os
import logging
import re
import datetime

from google.appengine.ext import webapp
from google.appengine.ext.webapp import template

from Session import *
from Application import *


class SessionViewerHandler(webapp.RequestHandler):
    def get(self):
        app_id = re.sub('.*/app/([^/]+)/.*', r'\1', self.request.path)
        id = re.sub('.*/session/([^/]+)/.*', r'\1', self.request.path)
        session = Session.get_by_key_name(id, Application.getById(app_id))

        template_values = {
            'session':                session,
        }
        path = os.path.join(os.path.dirname(__file__), 'templates/SessionViewer.html')
        self.response.out.write(template.render(path, template_values))
