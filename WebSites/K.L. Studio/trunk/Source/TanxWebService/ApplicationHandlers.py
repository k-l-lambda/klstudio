
import uuid
import logging

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
