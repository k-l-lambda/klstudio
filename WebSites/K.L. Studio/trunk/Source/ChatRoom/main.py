
import os
import logging

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template


class HomeHandler(webapp.RequestHandler):
    def get(self):
        template_values = {
            'current_user':             users.get_current_user(),
            'logout_url':               users.create_logout_url(self.request.uri),
        }
        path = os.path.join(os.path.dirname(__file__), 'templates/Home.html')
        self.response.out.write(template.render(path, template_values))


class HostDialogHandler(webapp.RequestHandler):
    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'templates/HostDialog.html')
        self.response.out.write(template.render(path, {}))


def main():
    application = webapp.WSGIApplication([
        ('/projects/ChatRoom/',                                    HomeHandler),
        ('/projects/ChatRoom/host-dialog',                         HostDialogHandler),
        ], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
