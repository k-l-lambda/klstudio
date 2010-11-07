
import uuid
import logging
import string
import re

from google.appengine.ext import webapp

from Application import *
import Serializer


class ApplicationSetupSessionHandler(webapp.RequestHandler):
    def post(self):
        id = re.sub('.*/app/([^/]+)/.*', r'\1', self.request.path)
        app = Application.getById(id)

        host = users.get_current_user()

        session_id = str(uuid.uuid1())

        session = Session(key_name = session_id, parent = app)
        session.host = host
        session.alive = True
        session.next_host_message_id = 0
        session.next_guest_message_id = 0
        session.put()

        logging.info('session "%s" of app "%s" setup.', session_id, id)

        self.response.out.write('{id="%s"}' % session_id)


class ApplicationSessionListHandler(webapp.RequestHandler):
    def get(self):
        id = re.sub('.*/app/([^/]+)/.*', r'\1', self.request.path)
        app = Application.getById(id)

        offset = int(self.request.str_GET.get('offset', 0))
        limit = int(self.request.str_GET.get('limit', 100))
        tag = self.request.str_GET.get('tag')
        host = self.request.str_GET.get('host')

        session_list = app.sessionList(True)
        total = session_list.count()

        session_list = session_list.fetch(limit, offset)
        try:
            if host:
                session_list = filter(lambda session : re.match(host, session.host.nickname()), session_list)
        except:
            pass
        if tag:
            session_list = filter(lambda session : tag in session.tags, session_list)

        session_list_str = '{%s}' % string.join(['{id="%s",host="%s",setup_time="%s",tags=%s},' % (session.id(), session.host.nickname(), session.setup_time, Serializer.save(session.tags)) for session in session_list], ',')

        self.response.out.write('{total=%d,list=%s}' % (total, session_list_str))
