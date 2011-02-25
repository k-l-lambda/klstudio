
import os
import logging
import re
import datetime

from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.api import users

from Session import *
from Application import *


class SessionViewerHandler(webapp.RequestHandler):
    def get(self):
        app_id = re.sub('.*/app/([^/]+)/.*', r'\1', self.request.path)
        id = re.sub('.*/session/([^/]+)/.*', r'\1', self.request.path)
        session = Session.get_by_key_name(id, Application.getById(app_id))

        template_values = {
            'current_user':             users.get_current_user(),
            'logout_url':               users.create_logout_url(self.request.uri),
            'session':                  session,
            'is_host':                  session.host == users.get_current_user(),
        }
        path = os.path.join(os.path.dirname(__file__), 'templates/SessionViewer.html')
        self.response.out.write(template.render(path, template_values))


class SessionAddChannelMemberHandler(webapp.RequestHandler):
    def post(self):
        app_id = re.sub('.*/app/([^/]+)/.*', r'\1', self.request.path)
        session_id = re.sub('.*/session/([^/]+)/.*', r'\1', self.request.path)
        session = Session.get_by_key_name(session_id, Application.getById(app_id))

        channel = SessionChannel.getById(self.request.get('channel'), session)
        member = users.User(self.request.get('member'))

        if not channel.members.count(member):
            channel.members.append(member)
            channel.put()

            logging.info('channel "%s" of session "%s" of app "%s" added member: %s.', channel.key().name(), session_id, app_id, member)

        self.redirect('./')


class SessionEditTagsHandler(webapp.RequestHandler):
    def post(self):
        app_id = re.sub('.*/app/([^/]+)/.*', r'\1', self.request.path)
        session_id = re.sub('.*/session/([^/]+)/.*', r'\1', self.request.path)
        session = Session.get_by_key_name(session_id, Application.getById(app_id))

        session.tags = self.request.get('tags').split(",")
        session.put()

        self.redirect('./')
