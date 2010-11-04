
import uuid
import logging
import re

from google.appengine.ext import webapp

from Application import *


class ApplicationSetupSessionHandler(webapp.RequestHandler):
    def post(self):
        id = re.sub('.*/app/([^/]+)/.*', r'\1', self.request.path)
        app = Application.getById(id)

        host = users.get_current_user()

        session_id = str(uuid.uuid1())

        session = Session(key_name = session_id, parent = app)
        session.host = host
        session.active = True
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

        session_list = app.sessionList(True)
        total = session_list.count()

        session_list = session_list.fetch(limit, offset)

        session_list_str = '{'
        for session in session_list:
            session_list_str += '{host="%s",setup_time="%s"},' % (session.host.nickname(), session.setup_time)
        session_list_str += '}'

        self.response.out.write('{total=%d,list=%s}' % (total, session_list_str))
