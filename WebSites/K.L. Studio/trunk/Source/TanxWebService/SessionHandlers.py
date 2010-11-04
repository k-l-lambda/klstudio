
import logging

from google.appengine.ext import webapp

from Session import *
from Application import *


class SessionInfoHandler(webapp.RequestHandler):
    def get(self):
        app_id = re.sub('.*/app/([^/]+)/.*', r'\1', self.request.path)
        id = re.sub('.*/session/([^/]+)/.*', r'\1', self.request.path)
        session = Session.get_by_key_name(id, Application.getById(app_id))
        if session:
            self.response.out.write('{info={host="%s",setup_time="%s",active=%s,next_host_message_id=%d,next_guest_message_id=%d}}'
                % (session.host.nickname(), session.setup_time, session.active, session.next_host_message_id, session.next_guest_message_id))
        else:
            logging.error('cannot find session of "%s/%s"', app_id, id)
            self.response.out.write('{error="cannot find session"}')
