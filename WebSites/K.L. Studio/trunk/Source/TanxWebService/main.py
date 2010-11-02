
import os
import datetime
import re
import logging

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template

from ApplicationHandlers import *
from SessionHandlers import *


class MainHandler(webapp.RequestHandler):
    def get(self):
        self.response.out.write('{result="hello!"}')

    def post(self):
        for arg in self.request.arguments():
            logging.info('%s: %s', arg, self.request.get(arg))


class UserInfoHandler(webapp.RequestHandler):
    def get(self):
        current_user = users.get_current_user()
        if current_user:
            self.response.out.write('{nickname="%s",email="%s",user_id="%s"}' % (current_user.nickname(), current_user.email(), current_user.user_id()))
        else:
            self.response.out.write('{}')


def main():
    application = webapp.WSGIApplication([
        ('/tanx-web-service/.*/',                               MainHandler),
        ('/tanx-web-service/.*/user-info',                      UserInfoHandler),
        ('/tanx-web-service/.*/app/.*/setup-session',           ApplicationSetupSessionHandler),
        ('/tanx-web-service/.*/app/.*/session/.*/info',         SessionInfoHandler),
        ], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
