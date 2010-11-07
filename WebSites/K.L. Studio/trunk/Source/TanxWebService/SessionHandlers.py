
import logging
import datetime
import re

from google.appengine.ext import webapp

from Session import *
from Application import *
import Serializer


class SessionInfoHandler(webapp.RequestHandler):
    def get(self):
        app_id = re.sub('.*/app/([^/]+)/.*', r'\1', self.request.path)
        id = re.sub('.*/session/([^/]+)/.*', r'\1', self.request.path)
        session = Session.get_by_key_name(id, Application.getById(app_id))
        if session:
            self.response.out.write('{info={host="%s",setup_time="%s",alive_time="%s",alive=%s,next_host_message_id=%d,next_guest_message_id=%d,tags=%s}}'
                % (session.host.nickname(), session.setup_time, session.alive_time, Serializer.save(session.alive), session.next_host_message_id, session.next_guest_message_id, Serializer.save(session.tags)))
        else:
            logging.error('cannot find session of "%s/%s"', app_id, id)
            self.response.out.write('{error="cannot find session"}')


class SessionKeepAliveHandler(webapp.RequestHandler):
    def post(self):
        app_id = re.sub('.*/app/([^/]+)/.*', r'\1', self.request.path)
        id = re.sub('.*/session/([^/]+)/.*', r'\1', self.request.path)
        session = Session.get_by_key_name(id, Application.getById(app_id))
        if session:
            session.alive_time = datetime.datetime.now()
            session.alive = True
            session.put()

            logging.info('session "%s" of app "%s" keep alive at %s.', id, app_id, session.alive_time)

            self.response.out.write('{result="OK",time="%s"}' % session.alive_time)
        else:
            logging.error('cannot find session of "%s/%s"', app_id, id)
            self.response.out.write('{result="Error",error="cannot find session"}')


class SessionSetTagsHandler(webapp.RequestHandler):
    def post(self):
        app_id = re.sub('.*/app/([^/]+)/.*', r'\1', self.request.path)
        id = re.sub('.*/session/([^/]+)/.*', r'\1', self.request.path)
        session = Session.get_by_key_name(id, Application.getById(app_id))
        if session:
            session.tags = self.request.get_all('tag')
            session.put()

            logging.info('session "%s" of app "%s" set tags: %s.', id, app_id, session.tags)

            self.response.out.write('{result="OK"}')
        else:
            logging.error('cannot find session of "%s/%s"', app_id, id)
            self.response.out.write('{result="Error",error="cannot find session"}')
